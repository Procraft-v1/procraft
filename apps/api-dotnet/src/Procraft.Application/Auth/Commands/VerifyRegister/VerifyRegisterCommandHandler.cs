using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;
using RefreshTokenEntity = Procraft.Domain.Entities.RefreshToken;

namespace Procraft.Application.Auth.Commands.VerifyRegister;

public sealed class VerifyRegisterCommandHandler : IRequestHandler<VerifyRegisterCommand, AuthResultDto>
{
    private const int MaxAttempts = 5;

    private readonly IApplicationDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ICookieService _cookies;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public VerifyRegisterCommandHandler(
        IApplicationDbContext db,
        ITokenService tokenService,
        ICookieService cookies,
        IRequestContext request,
        IOptions<JwtOptions> jwt)
    {
        _db = db;
        _tokenService = tokenService;
        _cookies = cookies;
        _request = request;
        _jwt = jwt.Value;
    }

    public async Task<AuthResultDto> Handle(VerifyRegisterCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var registration = await _db.PendingRegistrations
            .FirstOrDefaultAsync(x => x.Id == request.VerificationId, cancellationToken);

        if (registration is null || registration.ConsumedAt.HasValue || registration.ExpiresAt <= now)
        {
            throw new UnauthorizedException("Register verification code is invalid or expired.");
        }

        if (registration.AttemptCount >= MaxAttempts)
        {
            registration.ConsumedAt = now;
            registration.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Too many register verification attempts.");
        }

        var submittedHash = HashRegisterCode(registration.Id, request.Code, _jwt.Secret);
        if (!FixedTimeEquals(registration.CodeHash, submittedHash))
        {
            registration.AttemptCount += 1;
            registration.UpdatedAt = now;

            if (registration.AttemptCount >= MaxAttempts)
            {
                registration.ConsumedAt = now;
            }

            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Register verification code is invalid or expired.");
        }

        if (await _db.Users.AsNoTracking().AnyAsync(x => x.Email == registration.Email, cancellationToken))
        {
            registration.ConsumedAt = now;
            registration.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);
            throw new ConflictException(new Dictionary<string, string[]>
            {
                ["email"] = new[] { "Email is already taken" },
            });
        }

        if (await _db.Users.AsNoTracking().AnyAsync(x => x.Username == registration.Username, cancellationToken))
        {
            registration.ConsumedAt = now;
            registration.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);
            throw new ConflictException(new Dictionary<string, string[]>
            {
                ["username"] = new[] { "Username is already taken" },
            });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = registration.Email,
            Username = registration.Username,
            PhoneNumber = registration.PhoneNumber,
            PasswordHash = registration.PasswordHash,
            IsEmailConfirmed = true,
            CreatedAt = now,
        };

        var refreshPlain = _tokenService.GenerateRefreshPlaintext();
        var refreshHash = _tokenService.HashRefreshToken(refreshPlain);
        var refreshRow = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            TokenHash = refreshHash,
            ExpiresAt = now.AddDays(_jwt.RefreshTokenDays),
            CreatedByIp = _request.IpAddress,
            UserAgent = _request.UserAgent,
            CreatedAt = now,
        };

        user.RefreshTokens.Add(refreshRow);
        registration.ConsumedAt = now;
        registration.UpdatedAt = now;

        await _db.Users.AddAsync(user, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var access = _tokenService.CreateAccessToken(user);
        _cookies.AppendAccessToken(access);
        _cookies.AppendRefreshToken(refreshPlain);

        return new AuthResultDto
        {
            User = AuthUserDto.FromUser(user),
        };
    }

    private static string HashRegisterCode(Guid verificationId, string code, string secret)
    {
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException("JWT signing secret is not configured (Jwt:Secret or JWT_SECRET).");
        }

        var key = Encoding.UTF8.GetBytes(secret);
        var payload = Encoding.UTF8.GetBytes($"{verificationId:N}:{code}");
        using var hmac = new HMACSHA256(key);
        return Convert.ToHexString(hmac.ComputeHash(payload));
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = Convert.FromHexString(left);
        var rightBytes = Convert.FromHexString(right);
        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}
