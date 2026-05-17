using System.Globalization;
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

namespace Procraft.Application.Auth.Commands.Register;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterChallengeDto>
{
    private const int CodeLength = 4;
    private const int CodeExpiresInMinutes = 5;

    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _email;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public RegisterCommandHandler(
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

    public async Task<RegisterChallengeDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();

        if (await _db.Users.AsNoTracking().AnyAsync(u => u.Email == normalizedEmail, cancellationToken))
        {
            throw new ConflictException(new Dictionary<string, string[]>
            {
                ["email"] = new[] { "Email is already taken" },
            });
        }

        if (await _db.Users.AsNoTracking().AnyAsync(u => u.Username == normalizedUsername, cancellationToken))
        {
            throw new ConflictException(new Dictionary<string, string[]>
            {
                ["username"] = new[] { "Username is already taken" },
            });
        }

        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(CodeExpiresInMinutes);
        var verificationId = Guid.NewGuid();

        var activeRegistrations = await _db.PendingRegistrations
            .Where(x =>
                x.ConsumedAt == null &&
                x.ExpiresAt > now &&
                (x.Email == normalizedEmail || x.Username == normalizedUsername))
            .ToListAsync(cancellationToken);

        foreach (var activeRegistration in activeRegistrations)
        {
            activeRegistration.ConsumedAt = now;
            activeRegistration.UpdatedAt = now;
        }

        var code = RandomNumberGenerator.GetInt32(0, 10_000).ToString("D4", CultureInfo.InvariantCulture);
        var registration = new PendingRegistration
        {
            Id = verificationId,
            Email = normalizedEmail,
            Username = normalizedUsername,
            PasswordHash = _passwordHasher.Hash(request.Password),
            CodeHash = HashRegisterCode(verificationId, code, _jwt.Secret),
            ExpiresAt = expiresAt,
            CreatedByIp = _request.IpAddress,
            UserAgent = _request.UserAgent,
            CreatedAt = now,
        };

        await _db.PendingRegistrations.AddAsync(registration, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        await _email.SendAsync(
            normalizedEmail,
            "Procraft ro'yxatdan o'tish kodi",
            $"Procraft account yaratish kodi: {code}\nKod {CodeExpiresInMinutes} daqiqa amal qiladi.",
            cancellationToken);

        return new RegisterChallengeDto
        {
            VerificationId = verificationId,
            MaskedEmail = MaskEmail(normalizedEmail),
            ExpiresAt = expiresAt,
            CodeLength = CodeLength,
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
