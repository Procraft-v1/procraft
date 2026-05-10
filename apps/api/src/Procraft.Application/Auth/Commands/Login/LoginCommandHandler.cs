using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace Procraft.Application.Auth.Commands.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, LoginChallengeDto>
{
    private const int CodeLength = 4;
    private const int CodeExpiresInMinutes = 5;

    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _email;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public LoginCommandHandler(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IEmailService email,
        IRequestContext request,
        IOptions<JwtOptions> jwt)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _email = email;
        _request = request;
        _jwt = jwt.Value;
    }

    public async Task<LoginChallengeDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var key = request.EmailOrUsername.Trim().ToLowerInvariant();

        var user = await _db.Users
            .FirstOrDefaultAsync(
                u => u.Email == key || u.Username == key,
                cancellationToken);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid credentials.");
        }

        var now = DateTimeOffset.UtcNow;

        var activeCodes = await _db.LoginVerificationCodes
            .Where(x => x.UserId == user.Id && x.ConsumedAt == null && x.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        foreach (var activeCode in activeCodes)
        {
            activeCode.ConsumedAt = now;
            activeCode.UpdatedAt = now;
        }

        var verificationId = Guid.NewGuid();
        var code = RandomNumberGenerator.GetInt32(0, 10_000).ToString("D4", CultureInfo.InvariantCulture);
        var expiresAt = now.AddMinutes(CodeExpiresInMinutes);

        var verification = new LoginVerificationCode
        {
            Id = verificationId,
            UserId = user.Id,
            User = user,
            CodeHash = HashVerificationCode(verificationId, code, _jwt.Secret),
            ExpiresAt = expiresAt,
            CreatedByIp = _request.IpAddress,
            UserAgent = _request.UserAgent,
            CreatedAt = now,
        };

        await _db.LoginVerificationCodes.AddAsync(verification, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        await _email.SendAsync(
            user.Email,
            "Procraft login kodi",
            $"Procraft hisobingizga kirish kodi: {code}\nKod {CodeExpiresInMinutes} daqiqa amal qiladi.",
            cancellationToken);

        return new LoginChallengeDto
        {
            VerificationId = verificationId,
            MaskedEmail = MaskEmail(user.Email),
            ExpiresAt = expiresAt,
            CodeLength = CodeLength,
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

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 1)
        {
            return email;
        }

        var name = email[..at];
        var domain = email[at..];
        return $"{name[0]}***{domain}";
    }
}
