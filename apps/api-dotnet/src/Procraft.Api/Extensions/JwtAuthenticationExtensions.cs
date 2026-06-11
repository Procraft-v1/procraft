using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Security;

namespace Procraft.Api.Extensions;

public static class JwtAuthenticationExtensions
{
    /// <summary>Registers JWT Bearer auth; access token is read from the configured HttpOnly cookie.</summary>
    public static IServiceCollection AddProcraftJwtCookieAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        services.AddSingleton<IPostConfigureOptions<JwtBearerOptions>, ConfigureJwtBearerFromAppOptions>();

        return services;
    }

    private sealed class ConfigureJwtBearerFromAppOptions : IPostConfigureOptions<JwtBearerOptions>
    {
        private readonly IOptionsMonitor<JwtOptions> _jwt;
        private readonly IOptionsMonitor<AuthCookieOptions> _cookies;

        public ConfigureJwtBearerFromAppOptions(
            IOptionsMonitor<JwtOptions> jwt,
            IOptionsMonitor<AuthCookieOptions> cookies)
        {
            _jwt = jwt;
            _cookies = cookies;
        }

        public void PostConfigure(string? name, JwtBearerOptions options)
        {
            if (name != JwtBearerDefaults.AuthenticationScheme)
            {
                return;
            }

            var jwt = _jwt.CurrentValue;

            if (string.IsNullOrWhiteSpace(jwt.Secret) || jwt.Secret.Length < 32)
            {
                throw new InvalidOperationException("Jwt:Secret must be configured and at least 32 characters before JWT authentication starts.");
            }

            byte[] signingKeyMaterial = Encoding.UTF8.GetBytes(jwt.Secret ?? string.Empty);

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidIssuer = jwt.Issuer,
                ValidAudience = jwt.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(signingKeyMaterial),
                NameClaimType = ClaimTypes.NameIdentifier,
                ClockSkew = TimeSpan.FromMinutes(1),
            };

            var cookieName = _cookies.CurrentValue.AccessCookieName;

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (!string.IsNullOrEmpty(context.Token))
                    {
                        return Task.CompletedTask;
                    }

                    if (context.Request.Cookies.TryGetValue(cookieName, out var token))
                    {
                        context.Token = token;
                    }

                    return Task.CompletedTask;
                },
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new { message = "Not authenticated." });
                },
            };
        }
    }
}
