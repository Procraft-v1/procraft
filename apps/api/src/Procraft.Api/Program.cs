using Procraft.Api.Extensions;
using Procraft.Api.Middleware;
using Procraft.Application;
using Procraft.Application.Common.Interfaces;
using Procraft.Infrastructure;
using Procraft.Infrastructure.Options;
using Procraft.Infrastructure.Persistence;
using Procraft.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, loggerConfiguration) =>
{
    loggerConfiguration.ReadFrom.Configuration(context.Configuration);
});

builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddProcraftJwtCookieAuthentication();
builder.Services.AddAuthorization(o =>
{
    o.FallbackPolicy = null;
});

builder.Services.AddCookiePolicy(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
    options.Secure = builder.Environment.IsProduction()
        ? CookieSecurePolicy.Always
        : CookieSecurePolicy.None;
});

builder.Services.AddProcraftSwagger();
builder.Services.AddProcraftCors(builder.Configuration);

builder.WireJwtSecretsFromEnvironment();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
});

app.UseSerilogRequestLogging();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCookiePolicy();

var uploadsOptions = builder.Configuration.GetSection("Uploads").Get<UploadsOptions>() ?? new UploadsOptions();
var uploadsRoot = Path.GetFullPath(uploadsOptions.RootPath);
Directory.CreateDirectory(uploadsRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = uploadsOptions.PublicBasePath,
});

app.UseRouting();

app.UseProcraftCors();
app.UseProcraftSwagger();

app.UseAuthentication();
app.UseMiddleware<CsrfMiddleware>();

app.UseAuthorization();

app.UseIssueCsrfCookieAfterAuth();

app.MapControllers();
app.MapStandaloneHealth();

try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    var migrationsAssembly = typeof(ApplicationDbContext).Assembly.FullName;
    var discoveredMigrations = db.Database.GetMigrations().ToList();
    Log.Information(
        "EF Core migration assembly loaded. Assembly={MigrationAssembly}; Discovered={DiscoveredCount}; DiscoveredMigrations={DiscoveredMigrations}",
        migrationsAssembly,
        discoveredMigrations.Count,
        string.Join(", ", discoveredMigrations));

    if (discoveredMigrations.Count == 0)
    {
        throw new InvalidOperationException(
            $"No EF Core migrations were discovered in assembly '{migrationsAssembly}'. " +
            "The published Docker image is missing compiled migrations or the DbContext migration assembly is misconfigured.");
    }

    var appliedBefore = (await db.Database.GetAppliedMigrationsAsync()).ToList();
    var pendingBefore = (await db.Database.GetPendingMigrationsAsync()).ToList();
    Log.Information("Pending migrations: {Migrations}", string.Join(", ", pendingBefore));

    Log.Information(
        "EF Core migration startup check. Assembly={MigrationAssembly}; Discovered={DiscoveredCount}; Applied={AppliedCount}; Pending={PendingCount}; PendingMigrations={PendingMigrations}",
        migrationsAssembly,
        discoveredMigrations.Count,
        appliedBefore.Count,
        pendingBefore.Count,
        pendingBefore);

    await db.Database.MigrateAsync();

    var appliedAfter = (await db.Database.GetAppliedMigrationsAsync()).ToList();
    var stillPending = (await db.Database.GetPendingMigrationsAsync()).ToList();
    if (stillPending.Count > 0)
    {
        throw new InvalidOperationException(
            $"EF Core migration did not apply all migrations. Pending migrations: {string.Join(", ", stillPending)}");
    }

    Log.Information(
        "EF Core migrations applied successfully. Applied={AppliedCount}; AppliedMigrations={AppliedMigrations}",
        appliedAfter.Count,
        appliedAfter);

    await TemplateSeeder.SeedAsync(db);

    if (app.Environment.IsDevelopment())
    {
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await StaticAccountSeeder.SeedAsync(db, passwordHasher);
    }

    Log.Information("Database migrations and seeding completed successfully.");
}
catch (Exception ex)
{
    Log.Error(ex, "Database migration or seeding failed. Check DATABASE_URL configuration.");
    throw;
}

try
{
    Log.Information("Starting Procraft API host");
    app.Run();
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program;
