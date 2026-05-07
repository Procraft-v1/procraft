namespace Procraft.Api.Extensions;

public static class CorsExtensions
{
    private const string DevPolicy = "DevelopmentSpaClients";
    private const string ProdPolicy = "ProductionSpaClients";

    public static IServiceCollection AddProcraftCors(this IServiceCollection services, IConfiguration configuration)
    {
        var devOrigins = configuration.GetSection("Cors:DevelopmentOrigins").Get<string[]>() ?? Array.Empty<string>();
        var prodOrigins = configuration.GetSection("Cors:ProductionOrigins").Get<string[]>() ?? Array.Empty<string>();

        services.AddCors(options =>
        {
            options.AddPolicy(
                DevPolicy,
                policy =>
                {
                    policy.WithOrigins(devOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });

            options.AddPolicy(
                ProdPolicy,
                policy =>
                {
                    if (prodOrigins.Length > 0)
                    {
                        policy.WithOrigins(prodOrigins);
                    }
                    else
                    {
                        policy.SetIsOriginAllowedToAllowWildcardSubdomains()
                            .WithOrigins("https://*.procraft.uz", "https://procraft.uz");
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
        var policy = app.Environment.IsDevelopment() ? DevPolicy : ProdPolicy;
        app.UseCors(policy);
        return app;
    }
}
