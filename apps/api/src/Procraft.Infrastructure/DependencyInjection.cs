using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Common.Security;
using Procraft.Infrastructure.Auth;
using Procraft.Infrastructure.Email;
using Procraft.Infrastructure.FileStorage;
using Procraft.Infrastructure.Options;
using Procraft.Infrastructure.Pdf;
using Procraft.Infrastructure.Persistence;
using Procraft.Infrastructure.Services;
using Procraft.Infrastructure.Telegram;

namespace Procraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.Configure<AuthCookieOptions>(configuration.GetSection("Cookies"));
        services.Configure<UploadsOptions>(configuration.GetSection("Uploads"));

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["DATABASE_URL"];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Database connection string is missing. Set ConnectionStrings:DefaultConnection or DATABASE_URL.");
        }

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        services.AddHttpContextAccessor();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddScoped<IPdfService, QuestPdfService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICookieService, CookieService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IRequestContext, RequestContextService>();
        services.AddSingleton<TelegramBotService>();

        return services;
    }
}
