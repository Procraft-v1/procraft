using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using RefreshTokenEntity = Procraft.Domain.Entities.RefreshToken;

namespace Procraft.Application.Auth.Commands.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ICookieService _cookies;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public LoginCommandHandler(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ICookieService cookies,
        IRequestContext request,
        IOptions<JwtOptions> jwt)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _cookies = cookies;
        _request = request;
        _jwt = jwt.Value;
    }

    public async Task<AuthResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
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

        if (!user.IsEmailConfirmed)
        {
            throw new UnauthorizedException("Email is not confirmed.");
        }

        var now = DateTimeOffset.UtcNow;
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

        await _db.RefreshTokens.AddAsync(refreshRow, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var access = _tokenService.CreateAccessToken(user);
        _cookies.AppendAccessToken(access);
        _cookies.AppendRefreshToken(refreshPlain);

        return new AuthResultDto
        {
            User = AuthUserDto.FromUser(user),
        };
    }
}
