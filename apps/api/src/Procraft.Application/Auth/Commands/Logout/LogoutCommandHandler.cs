using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.Auth.Commands.Logout;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, LogoutResponseDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICookieService _cookies;
    private readonly ITokenService _tokens;
    private readonly IRequestContext _request;

    public LogoutCommandHandler(
        IApplicationDbContext db,
        ICookieService cookies,
        ITokenService tokens,
        IRequestContext request)
    {
        _db = db;
        _cookies = cookies;
        _tokens = tokens;
        _request = request;
    }

    public async Task<LogoutResponseDto> Handle(LogoutCommand _, CancellationToken cancellationToken)
    {
        var plain = _cookies.GetPlainRefreshToken();
        if (!string.IsNullOrWhiteSpace(plain))
        {
            var hash = _tokens.HashRefreshToken(plain);
            var token = await _db.RefreshTokens
                .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

            if (token is { RevokedAt: null })
            {
                var now = DateTimeOffset.UtcNow;
                token.RevokedAt = now;
                token.RevokedByIp = _request.IpAddress;
                token.UpdatedAt = now;
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        _cookies.ClearAuthCookies();

        return new LogoutResponseDto
        {
            Message = "Logged out successfully",
        };
    }
}
