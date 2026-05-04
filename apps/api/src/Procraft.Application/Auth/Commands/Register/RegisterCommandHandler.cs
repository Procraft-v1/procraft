using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;
using Microsoft.Extensions.Options;

namespace Procraft.Application.Auth.Commands.Register;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ICookieService _cookies;
    private readonly IRequestContext _request;
    private readonly JwtOptions _jwt;

    public RegisterCommandHandler(
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

    public async Task<AuthResultDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
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
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            Username = normalizedUsername,
            PasswordHash = _passwordHasher.Hash(request.Password),
            IsEmailConfirmed = false,
            CreatedAt = now,
        };

        var refreshPlain = _tokenService.GenerateRefreshPlaintext();
        var refreshHash = _tokenService.HashRefreshToken(refreshPlain);

        var refreshRow = new RefreshToken
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
}
