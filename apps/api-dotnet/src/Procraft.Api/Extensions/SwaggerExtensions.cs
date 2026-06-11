using Microsoft.OpenApi.Models;

namespace Procraft.Api.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddProcraftSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc(
                "v1",
                new OpenApiInfo
                {
                    Title = "Procraft API",
                    Version = "v1",
                    Description = "Procraft backend gateway (cookie-based auth scaffolding, CSRF placeholders).",
                });
        });

        return services;
    }

    public static WebApplication UseProcraftSwagger(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return app;
        }

        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "Procraft API v1");
        });

        return app;
    }
}
