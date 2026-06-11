namespace Procraft.Application.Common.Configuration;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;

    public int RefreshTokenDays { get; set; } = 7;

    /// <summary>
    /// Symmetric secret for JWT signing (mapped from Jwt:Secret or JWT_SECRET env).
    /// </summary>
    public string Secret { get; set; } = string.Empty;
}
