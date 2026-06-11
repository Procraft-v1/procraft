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
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection("Jwt"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Secret), "Jwt:Secret is required. Set Jwt:Secret or JWT_SECRET.")
            .Validate(options => options.Secret.Length >= 32, "Jwt:Secret must be at least 32 characters.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Issuer), "Jwt:Issuer is required. Set Jwt:Issuer or JWT_ISSUER.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Audience), "Jwt:Audience is required. Set Jwt:Audience or JWT_AUDIENCE.")
            .Validate(options => options.AccessTokenMinutes > 0, "Jwt:AccessTokenMinutes must be greater than zero.")
            .Validate(options => options.RefreshTokenDays > 0, "Jwt:RefreshTokenDays must be greater than zero.")
            .ValidateOnStart();

        services.AddOptions<AuthCookieOptions>()
            .Bind(configuration.GetSection("Cookies"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.AccessCookieName), "Cookies:AccessCookieName is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.RefreshCookieName), "Cookies:RefreshCookieName is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.SameSite), "Cookies:SameSite is required.")
            .Validate(options => Enum.TryParse<Microsoft.AspNetCore.Http.SameSiteMode>(options.SameSite, true, out _), "Cookies:SameSite must be Strict, Lax, None, or Unspecified.")
            .ValidateOnStart();

        services.AddOptions<UploadsOptions>()
            .Bind(configuration.GetSection("Uploads"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.RootPath), "Uploads:RootPath is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.PublicBasePath), "Uploads:PublicBasePath is required.")
            .Validate(options => options.PublicBasePath.StartsWith('/'), "Uploads:PublicBasePath must start with '/'.")
            .Validate(options => options.MaxAvatarSizeMb > 0, "Uploads:MaxAvatarSizeMb must be greater than zero.")
            .ValidateOnStart();

        services.AddOptions<SmtpOptions>()
            .Bind(configuration.GetSection("Smtp"));

        services.AddOptions<TelegramOptions>()
            .Bind(configuration.GetSection("Telegram"));

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["DATABASE_URL"];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Database connection string is missing. Set ConnectionStrings:DefaultConnection or DATABASE_URL.");
        }

        var migrationsAssembly = typeof(ApplicationDbContext).Assembly.FullName;

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly(migrationsAssembly)));

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
