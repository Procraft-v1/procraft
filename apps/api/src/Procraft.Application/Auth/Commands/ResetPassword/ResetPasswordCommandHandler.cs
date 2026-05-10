using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, PasswordResetResultDto>
{
    private const int MaxAttempts = 5;

    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly JwtOptions _jwt;

    public ResetPasswordCommandHandler(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IOptions<JwtOptions> jwt)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwt = jwt.Value;
    }

    public async Task<PasswordResetResultDto> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var resetCode = await _db.PasswordResetCodes
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == request.ResetId, cancellationToken);

        if (resetCode is null || resetCode.ConsumedAt.HasValue || resetCode.ExpiresAt <= now)
        {
            throw new UnauthorizedException("Password reset code is invalid or expired.");
        }

        if (resetCode.AttemptCount >= MaxAttempts)
        {
            resetCode.ConsumedAt = now;
            resetCode.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Too many password reset attempts.");
        }

        var submittedHash = HashResetCode(resetCode.Id, request.Code, _jwt.Secret);
        if (!FixedTimeEquals(resetCode.CodeHash, submittedHash))
        {
            resetCode.AttemptCount += 1;
            resetCode.UpdatedAt = now;

            if (resetCode.AttemptCount >= MaxAttempts)
            {
                resetCode.ConsumedAt = now;
            }

            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Password reset code is invalid or expired.");
        }

        resetCode.User.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        resetCode.User.UpdatedAt = now;
        resetCode.ConsumedAt = now;
        resetCode.UpdatedAt = now;

        var activeRefreshTokens = await _db.RefreshTokens
            .Where(x => x.UserId == resetCode.UserId && x.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in activeRefreshTokens)
        {
            refreshToken.RevokedAt = now;
            refreshToken.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new PasswordResetResultDto();
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

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = Convert.FromHexString(left);
        var rightBytes = Convert.FromHexString(right);
        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}
