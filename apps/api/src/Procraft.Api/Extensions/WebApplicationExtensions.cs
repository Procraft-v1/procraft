using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Security;

namespace Procraft.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication MapStandaloneHealth(this WebApplication app)
    {
        app.MapGet(
            "/health",
            () => Results.Ok(new { status = "Healthy" }));

        return app;
    }

    /// <summary>Binds Jwt and cookie options from Jwt_*/JWT_* environment variables.</summary>
    public static void WireJwtSecretsFromEnvironment(this WebApplicationBuilder builder)
    {
        builder.Services.PostConfigure<JwtOptions>(options =>
        {
            if (string.IsNullOrWhiteSpace(options.Secret))
            {
                var secret = builder.Configuration["JWT_SECRET"];
                if (!string.IsNullOrWhiteSpace(secret))
                {
                    options.Secret = secret;
                }
            }

            if (string.IsNullOrWhiteSpace(options.Issuer))
            {
                var issuer = builder.Configuration["JWT_ISSUER"];
                if (!string.IsNullOrWhiteSpace(issuer))
                {
                    options.Issuer = issuer;
                }
            }

            if (string.IsNullOrWhiteSpace(options.Audience))
            {
                var audience = builder.Configuration["JWT_AUDIENCE"];
                if (!string.IsNullOrWhiteSpace(audience))
                {
                    options.Audience = audience;
                }
            }

            if (int.TryParse(builder.Configuration["JWT_ACCESS_MINUTES"], out var accessMinutes) &&
                accessMinutes > 0)
            {
                options.AccessTokenMinutes = accessMinutes;
            }

            if (int.TryParse(builder.Configuration["JWT_REFRESH_DAYS"], out var refreshDays) &&
                refreshDays > 0)
            {
                options.RefreshTokenDays = refreshDays;
            }
        });

        builder.Services.PostConfigure<AuthCookieOptions>(options =>
        {
            var accessCookie = builder.Configuration["JWT_ACCESS_COOKIE_NAME"];
            if (!string.IsNullOrWhiteSpace(accessCookie))
            {
                options.AccessCookieName = accessCookie!;
            }

            var refreshCookie = builder.Configuration["JWT_REFRESH_COOKIE_NAME"];
            if (!string.IsNullOrWhiteSpace(refreshCookie))
            {
                options.RefreshCookieName = refreshCookie!;
            }
        });
    }
}
