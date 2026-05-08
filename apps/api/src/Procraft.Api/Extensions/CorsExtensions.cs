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
                    if (prodOrigins.Length > 0)
                    {
                        policy.WithOrigins(prodOrigins);
                    }
                    else
                    {
                        policy.WithOrigins();
                    }

                    policy.AllowAnyHeader()
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
}
