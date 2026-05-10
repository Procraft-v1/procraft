using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using RefreshTokenEntity = Procraft.Domain.Entities.RefreshToken;

namespace Procraft.Application.Auth.Commands.VerifyLogin;

public sealed class VerifyLoginCommandHandler : IRequestHandler<VerifyLoginCommand, AuthResultDto>
{
    private const int MaxAttempts = 5;

    private readonly IApplicationDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ICookieService _cookies;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public VerifyLoginCommandHandler(
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

    public async Task<AuthResultDto> Handle(VerifyLoginCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var verification = await _db.LoginVerificationCodes
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == request.VerificationId, cancellationToken);

        if (verification is null || verification.ConsumedAt.HasValue || verification.ExpiresAt <= now)
        {
            throw new UnauthorizedException("Login verification code is invalid or expired.");
        }

        if (verification.AttemptCount >= MaxAttempts)
        {
            verification.ConsumedAt = now;
            verification.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Too many login verification attempts.");
        }

        var submittedHash = HashVerificationCode(verification.Id, request.Code, _jwt.Secret);
        if (!FixedTimeEquals(verification.CodeHash, submittedHash))
        {
            verification.AttemptCount += 1;
            verification.UpdatedAt = now;

            if (verification.AttemptCount >= MaxAttempts)
            {
                verification.ConsumedAt = now;
            }

            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Login verification code is invalid or expired.");
        }

        verification.ConsumedAt = now;
        verification.UpdatedAt = now;

        var refreshPlain = _tokenService.GenerateRefreshPlaintext();
        var refreshHash = _tokenService.HashRefreshToken(refreshPlain);

        var refreshRow = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = verification.UserId,
            User = verification.User,
            TokenHash = refreshHash,
            ExpiresAt = now.AddDays(_jwt.RefreshTokenDays),
            CreatedByIp = _request.IpAddress,
            UserAgent = _request.UserAgent,
            CreatedAt = now,
        };

        await _db.RefreshTokens.AddAsync(refreshRow, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var access = _tokenService.CreateAccessToken(verification.User);
        _cookies.AppendAccessToken(access);
        _cookies.AppendRefreshToken(refreshPlain);

        return new AuthResultDto
        {
            User = AuthUserDto.FromUser(verification.User),
        };
    }

    private static string HashVerificationCode(Guid verificationId, string code, string secret)
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
