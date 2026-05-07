using Procraft.Api.Extensions;
using Procraft.Api.Middleware;
using Procraft.Application;
using Procraft.Infrastructure;
using Procraft.Infrastructure.Options;
using Procraft.Infrastructure.Persistence;
using Procraft.Infrastructure.Persistence.Seed;
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

app.UseProcraftSwagger();
app.UseProcraftCors();

app.UseAuthentication();
app.UseMiddleware<CsrfMiddleware>();

app.UseAuthorization();

app.MapControllers();
app.MapStandaloneHealth();

// Run migrations and seed reference data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
    await TemplateSeeder.SeedAsync(db);
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
