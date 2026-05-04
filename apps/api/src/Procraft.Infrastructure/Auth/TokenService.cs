using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Auth;

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _options;

    public TokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public string CreateAccessToken(User user)
    {
        if (string.IsNullOrWhiteSpace(_options.Secret))
        {
            throw new InvalidOperationException("JWT signing secret is not configured (Jwt:Secret or JWT_SECRET).");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new("preferred_username", user.Username),
            new(ClaimTypes.Name, user.Username),
        };

        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: now.AddMinutes(_options.AccessTokenMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshPlaintext(int sizeBytes = 48)
    {
        var bytes = RandomNumberGenerator.GetBytes(sizeBytes);
        return Convert.ToBase64String(bytes);
    }

    public string HashRefreshToken(string plaintextRefreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plaintextRefreshToken));
        return Convert.ToHexString(bytes);
    }
}
