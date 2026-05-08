using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Security;
using Procraft.Infrastructure.Options;
using Microsoft.Extensions.Options;

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

    public static WebApplication UseIssueCsrfCookieAfterAuth(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            var path = context.Request.Path;
            var method = context.Request.Method;
            var isAuthEndpoint =
                HttpMethods.IsPost(method) &&
                (path.StartsWithSegments("/api/auth/login", StringComparison.OrdinalIgnoreCase) ||
                 path.StartsWithSegments("/api/auth/register", StringComparison.OrdinalIgnoreCase) ||
                 path.StartsWithSegments("/api/auth/refresh", StringComparison.OrdinalIgnoreCase));

            if (isAuthEndpoint)
            {
                context.Response.OnStarting(() =>
                {
                    var statusCode = context.Response.StatusCode;
                    var options = context.RequestServices
                        .GetRequiredService<IOptions<AuthCookieOptions>>()
                        .Value;

                    if (statusCode is >= 200 and < 300 &&
                        !context.Request.Cookies.ContainsKey(options.CsrfCookieName))
                    {
                        CookieExtensions.IssueCsrfTokenCookie(context);
                    }

                    return Task.CompletedTask;
                });
            }

            await next();
        });

        return app;
    }

    /// <summary>Binds Jwt and cookie options from Jwt_*/JWT_* environment variables.</summary>
    public static void WireJwtSecretsFromEnvironment(this WebApplicationBuilder builder)
    {
        builder.Services.PostConfigure<JwtOptions>(options =>
        {
            var secret = builder.Configuration["JWT_SECRET"];
            if (!string.IsNullOrWhiteSpace(secret))
            {
                options.Secret = secret;
            }

            var issuer = builder.Configuration["JWT_ISSUER"];
            if (!string.IsNullOrWhiteSpace(issuer))
            {
                options.Issuer = issuer;
            }

            var audience = builder.Configuration["JWT_AUDIENCE"];
            if (!string.IsNullOrWhiteSpace(audience))
            {
                options.Audience = audience;
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

            var csrfCookie = builder.Configuration["CSRF_COOKIE_NAME"];
            if (!string.IsNullOrWhiteSpace(csrfCookie))
            {
                options.CsrfCookieName = csrfCookie!;
            }

            var sameSite = builder.Configuration["JWT_COOKIE_SAMESITE"];
            if (!string.IsNullOrWhiteSpace(sameSite))
            {
                options.SameSite = sameSite;
            }

            if (bool.TryParse(builder.Configuration["JWT_COOKIE_SECURE"], out var secure))
            {
                options.Secure = secure;
            }

            if (builder.Environment.IsProduction() && !options.Secure)
            {
                throw new InvalidOperationException("Cookies:Secure must be true in Production.");
            }
        });

        builder.Services.PostConfigure<UploadsOptions>(options =>
        {
            var uploadsRoot = builder.Configuration["UPLOADS_ROOT"];
            if (!string.IsNullOrWhiteSpace(uploadsRoot))
            {
                options.RootPath = uploadsRoot;
            }
        });
    }
}
