namespace Procraft.Api.Extensions;

public static class CorsExtensions
{
    private const string DevelopmentPolicy = "DevelopmentSpaClients";
    private const string ProductionPolicy = "ProductionSpaClients";

    public static IServiceCollection AddProcraftCors(this IServiceCollection services, IConfiguration configuration)
    {
        var devOrigins = configuration.GetSection("Cors:DevelopmentOrigins").Get<string[]>() ?? Array.Empty<string>();

        services.AddCors(options =>
        {
            options.AddPolicy(
                DevelopmentPolicy,
                policy =>
                {
                    policy.WithOrigins(devOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });

            var prodOriginsRaw = configuration["CORS_ALLOWED_ORIGINS"]
                ?? configuration["Cors:AllowedOrigins"];

            var prodOrigins = prodOriginsRaw?
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                ?? Array.Empty<string>();

            options.AddPolicy(
                ProductionPolicy,
                policy =>
                {
                    policy.SetIsOriginAllowed(origin => IsAllowedProductionOrigin(origin, prodOrigins))
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
        });

        return services;
    }

    public static WebApplication UseProcraftCors(this WebApplication app)
    {
        var policy = app.Environment.IsDevelopment() ? DevelopmentPolicy : ProductionPolicy;
        app.UseCors(policy);
        return app;
    }

    private static bool IsAllowedProductionOrigin(string origin, IReadOnlyCollection<string> configuredOrigins)
    {
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (configuredOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(uri.Host, "procraft.uz", StringComparison.OrdinalIgnoreCase)
            || uri.Host.EndsWith(".procraft.uz", StringComparison.OrdinalIgnoreCase);
    }
}
