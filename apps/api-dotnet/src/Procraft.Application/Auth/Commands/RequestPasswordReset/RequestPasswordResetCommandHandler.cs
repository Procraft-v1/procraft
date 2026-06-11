using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;

namespace Procraft.Application.Auth.Commands.RequestPasswordReset;

public sealed class RequestPasswordResetCommandHandler : IRequestHandler<RequestPasswordResetCommand, PasswordResetChallengeDto>
{
    private const int CodeLength = 4;
    private const int CodeExpiresInMinutes = 5;

    private readonly IApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public RequestPasswordResetCommandHandler(
        IApplicationDbContext db,
        IEmailService email,
        IRequestContext request,
        IOptions<JwtOptions> jwt)
    {
        _db = db;
        _email = email;
        _request = request;
        _jwt = jwt.Value;
    }

    public async Task<PasswordResetChallengeDto> Handle(RequestPasswordResetCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var resetId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(CodeExpiresInMinutes);

        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is not null)
        {
            var activeCodes = await _db.PasswordResetCodes
                .Where(x => x.UserId == user.Id && x.ConsumedAt == null && x.ExpiresAt > now)
                .ToListAsync(cancellationToken);

            foreach (var activeCode in activeCodes)
            {
                activeCode.ConsumedAt = now;
                activeCode.UpdatedAt = now;
            }

            var code = RandomNumberGenerator.GetInt32(0, 10_000).ToString("D4", CultureInfo.InvariantCulture);
            var resetCode = new PasswordResetCode
            {
                Id = resetId,
                UserId = user.Id,
                User = user,
                CodeHash = HashResetCode(resetId, code, _jwt.Secret),
                ExpiresAt = expiresAt,
                CreatedByIp = _request.IpAddress,
                UserAgent = _request.UserAgent,
                CreatedAt = now,
            };

            await _db.PasswordResetCodes.AddAsync(resetCode, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            await _email.SendAsync(
                user.Email,
                "Procraft parolni tiklash kodi",
                $"Procraft parolingizni tiklash kodi: {code}\nKod {CodeExpiresInMinutes} daqiqa amal qiladi.",
                cancellationToken);
        }

        return new PasswordResetChallengeDto
        {
            ResetId = resetId,
            MaskedEmail = MaskEmail(email),
            ExpiresAt = expiresAt,
            CodeLength = CodeLength,
        };
    }

    private static string HashResetCode(Guid resetId, string code, string secret)
    {
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException("JWT signing secret is not configured (Jwt:Secret or JWT_SECRET).");
        }

        var key = Encoding.UTF8.GetBytes(secret);
        var payload = Encoding.UTF8.GetBytes($"{resetId:N}:{code}");
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
