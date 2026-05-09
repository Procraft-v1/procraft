using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Enums;

namespace Procraft.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/admin")]
public sealed class AdminController : ControllerBase
{
    private const string AdminCookieName = "procraft_admin_session";

    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public AdminController(
        IApplicationDbContext db,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _db = db;
        _configuration = configuration;
        _environment = environment;
    }

    [HttpPost("login")]
    public ActionResult Login([FromBody] AdminLoginRequest request)
    {
        var credentials = ReadCredentials();

        if (!credentials.IsConfigured || !FixedEquals(request.Username, credentials.Username) || !FixedEquals(request.Password, credentials.Password))
        {
            return Unauthorized(new { message = "Invalid admin credentials" });
        }

        Response.Cookies.Append(AdminCookieName, BuildSessionToken(credentials), BuildCookieOptions());
        return Ok(new { authenticated = true });
    }

    [HttpPost("logout")]
    public ActionResult Logout()
    {
        Response.Cookies.Delete(AdminCookieName, BuildCookieOptions());
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("me")]
    public ActionResult Me()
    {
        return IsAdminAuthenticated()
            ? Ok(new { authenticated = true })
            : Unauthorized(new { message = "Admin session expired" });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsResponse>> GetStats(CancellationToken cancellationToken)
    {
        if (!IsAdminAuthenticated())
        {
            return Unauthorized(new { message = "Admin session expired" });
        }

        var totalUsers = await _db.Users.AsNoTracking().CountAsync(cancellationToken);
        var totalProfiles = await _db.Profiles.AsNoTracking().CountAsync(cancellationToken);
        var today = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);
        var sevenDaysAgo = DateTimeOffset.UtcNow.AddDays(-7);
        var usersToday = await _db.Users
            .AsNoTracking()
            .CountAsync(user => user.CreatedAt >= today, cancellationToken);
        var profilesToday = await _db.Profiles
            .AsNoTracking()
            .CountAsync(profile => profile.CreatedAt >= today, cancellationToken);
        var totalProfileViews = await _db.AnalyticsEvents
            .AsNoTracking()
            .CountAsync(item => item.EventType == AnalyticsEventType.PageView, cancellationToken);
        var profileViewsLast7Days = await _db.AnalyticsEvents
            .AsNoTracking()
            .CountAsync(item => item.EventType == AnalyticsEventType.PageView && item.CreatedAt >= sevenDaysAgo, cancellationToken);
        var profilesWithoutTemplate = await _db.Profiles
            .AsNoTracking()
            .CountAsync(profile => profile.TemplateId == null, cancellationToken);

        var templateUsage = await _db.Templates
            .AsNoTracking()
            .OrderBy(template => template.Name)
            .Select(template => new AdminTemplateUsageDto(
                template.Id,
                template.Name,
                template.Slug,
                template.Profiles.Count))
            .ToListAsync(cancellationToken);

        var topProfiles = await _db.AnalyticsEvents
            .AsNoTracking()
            .Where(item => item.EventType == AnalyticsEventType.PageView && item.ProfileId != null)
            .GroupBy(item => item.ProfileId!.Value)
            .Select(group => new
            {
                ProfileId = group.Key,
                Views = group.Count(),
            })
            .OrderByDescending(item => item.Views)
            .Take(5)
            .Join(
                _db.Profiles.AsNoTracking(),
                item => item.ProfileId,
                profile => profile.Id,
                (item, profile) => new { item, profile })
            .Join(
                _db.Users.AsNoTracking(),
                item => item.profile.UserId,
                user => user.Id,
                (item, user) => new AdminTopProfileDto(
                    item.profile.Id,
                    item.profile.FullName,
                    user.Username,
                    item.item.Views))
            .ToListAsync(cancellationToken);

        return Ok(new AdminStatsResponse(
            totalUsers,
            totalProfiles,
            usersToday,
            profilesToday,
            totalProfileViews,
            profileViewsLast7Days,
            profilesWithoutTemplate,
            templateUsage,
            topProfiles));
    }

    private bool IsAdminAuthenticated()
    {
        if (!Request.Cookies.TryGetValue(AdminCookieName, out var presented) || string.IsNullOrWhiteSpace(presented))
        {
            return false;
        }

        var credentials = ReadCredentials();
        return credentials.IsConfigured && FixedEquals(presented, BuildSessionToken(credentials));
    }

    private AdminCredentials ReadCredentials()
    {
        var username = ReadConfig("Admin:Username", "ADMIN_USERNAME");
        var password = ReadConfig("Admin:Password", "ADMIN_PASSWORD");
        var secret = ReadConfig("Admin:SessionSecret", "ADMIN_SESSION_SECRET")
            ?? ReadConfig("Jwt:Secret", "JWT_SECRET")
            ?? password;

        return new AdminCredentials(
            username ?? string.Empty,
            password ?? string.Empty,
            secret ?? string.Empty);
    }

    private string? ReadConfig(string key, string envKey) =>
        _configuration[key] ?? _configuration[envKey];

    private string BuildSessionToken(AdminCredentials credentials)
    {
        var value = $"{credentials.Username}:{credentials.Password}:{credentials.Secret}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    }

    private CookieOptions BuildCookieOptions() =>
        new()
        {
            HttpOnly = true,
            Secure = _environment.IsProduction(),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddHours(12),
        };

    private static bool FixedEquals(string? left, string? right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left ?? string.Empty);
        var rightBytes = Encoding.UTF8.GetBytes(right ?? string.Empty);
        return leftBytes.Length == rightBytes.Length && CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private sealed record AdminCredentials(string Username, string Password, string Secret)
    {
        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(Username)
            && !string.IsNullOrWhiteSpace(Password)
            && !string.IsNullOrWhiteSpace(Secret);
    }
}

public sealed record AdminLoginRequest(string Username, string Password);

public sealed record AdminStatsResponse(
    int TotalUsers,
    int TotalProfiles,
    int UsersToday,
    int ProfilesToday,
    int TotalProfileViews,
    int ProfileViewsLast7Days,
    int ProfilesWithoutTemplate,
    IReadOnlyCollection<AdminTemplateUsageDto> TemplateUsage,
    IReadOnlyCollection<AdminTopProfileDto> TopProfiles);

public sealed record AdminTemplateUsageDto(Guid TemplateId, string Name, string Slug, int Users);

public sealed record AdminTopProfileDto(Guid ProfileId, string FullName, string Username, int Views);
