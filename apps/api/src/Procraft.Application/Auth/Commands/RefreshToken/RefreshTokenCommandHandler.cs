using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;
using Microsoft.Extensions.Options;

namespace Procraft.Application.Auth.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ITokenService _tokens;
    private readonly ICookieService _cookies;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public RefreshTokenCommandHandler(
        IApplicationDbContext db,
        ITokenService tokens,
        ICookieService cookies,
        IRequestContext request,
        IOptions<JwtOptions> jwt)
    {
        _db = db;
        _tokens = tokens;
        _cookies = cookies;
        _request = request;
        _jwt = jwt.Value;
    }

    public async Task<AuthResultDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var plain = _cookies.GetPlainRefreshToken();
        if (string.IsNullOrWhiteSpace(plain))
        {
            throw new UnauthorizedException("Missing refresh token.");
        }

        var hash = _tokens.HashRefreshToken(plain);

        var stored = await _db.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.TokenHash == hash, cancellationToken);

        if (stored is null)
        {
            throw new UnauthorizedException("Refresh token is invalid.");
        }

        if (stored.RevokedAt.HasValue)
        {
            await RevokeAllSessionsAsync(stored.UserId, cancellationToken);
            throw new UnauthorizedException("Refresh token reuse detected.");
        }

        if (stored.IsExpired)
        {
            stored.RevokedAt = DateTimeOffset.UtcNow;
            stored.RevokedByIp = _request.IpAddress;
            stored.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Refresh token expired.");
        }

        var now = DateTimeOffset.UtcNow;

        var replacementPlain = _tokens.GenerateRefreshPlaintext();
        var replacementHash = _tokens.HashRefreshToken(replacementPlain);

        stored.RevokedAt = now;
        stored.RevokedByIp = _request.IpAddress;
        stored.ReplacedByTokenHash = replacementHash;
        stored.UpdatedAt = now;

        var next = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = stored.UserId,
            User = stored.User,
            TokenHash = replacementHash,
            ExpiresAt = now.AddDays(_jwt.RefreshTokenDays),
            CreatedByIp = _request.IpAddress,
            UserAgent = _request.UserAgent,
            CreatedAt = now,
        };

        await _db.RefreshTokens.AddAsync(next, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var access = _tokens.CreateAccessToken(stored.User);
        _cookies.AppendAccessToken(access);
        _cookies.AppendRefreshToken(replacementPlain);

        return new AuthResultDto
        {
            User = AuthUserDto.FromUser(stored.User),
        };
    }

    private async Task RevokeAllSessionsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var tokens = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = now;
            token.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}
