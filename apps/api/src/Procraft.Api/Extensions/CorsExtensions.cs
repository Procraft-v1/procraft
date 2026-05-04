namespace Procraft.Api.Extensions;

public static class CorsExtensions
{
    private const string DevelopmentPolicy = "DevelopmentSpaClients";

    public static IServiceCollection AddProcraftCors(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection("Cors:DevelopmentOrigins").Get<string[]>() ?? Array.Empty<string>();

        services.AddCors(options =>
        {
            options.AddPolicy(
                DevelopmentPolicy,
                policy =>
                {
                    policy.WithOrigins(origins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials(); // Required for axios withCredentials against cookies
                });
        });

        return services;
    }

    public static WebApplication UseProcraftCors(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseCors(DevelopmentPolicy);
        }

        return app;
    }
}
