using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Procraft.Application.Common.Configuration;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Common.Security;

namespace Procraft.Infrastructure.Auth;

public sealed class CookieService : ICookieService
{
    private readonly IHttpContextAccessor _http;
    private readonly AuthCookieOptions _options;
    private readonly JwtOptions _jwt;

    public CookieService(
        IHttpContextAccessor http,
        IOptions<AuthCookieOptions> options,
        IOptions<JwtOptions> jwt)
    {
        _http = http;
        _options = options.Value;
        _jwt = jwt.Value;
    }

    private HttpContext Context =>
        _http.HttpContext ?? throw new InvalidOperationException("HttpContext is not available.");

    public void AppendAccessToken(string jwt)
    {
        if (string.IsNullOrWhiteSpace(jwt))
        {
            return;
        }

        Context.Response.Cookies.Append(
            _options.AccessCookieName,
            jwt,
            BuildOptions(DateTimeOffset.UtcNow.AddMinutes(_jwt.AccessTokenMinutes)));
    }

    public void AppendRefreshToken(string plaintextRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(plaintextRefreshToken))
        {
            return;
        }

        Context.Response.Cookies.Append(
            _options.RefreshCookieName,
            plaintextRefreshToken,
            BuildOptions(DateTimeOffset.UtcNow.AddDays(_jwt.RefreshTokenDays)));
    }

    public string? GetPlainRefreshToken() =>
        Context.Request.Cookies.TryGetValue(_options.RefreshCookieName, out var raw) ? raw : null;

    public void ClearAuthCookies()
    {
        var opts = BuildOptions();
        Context.Response.Cookies.Delete(_options.AccessCookieName, opts);
        Context.Response.Cookies.Delete(_options.RefreshCookieName, opts);
    }

    private CookieOptions BuildOptions(DateTimeOffset? expires = null)
    {
        var sameSite = SameSiteMode.Lax;
        if (Enum.TryParse<SameSiteMode>(_options.SameSite, true, out var parsed))
        {
            sameSite = parsed;
        }

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = _options.Secure,
            SameSite = sameSite,
            Path = "/",
            Expires = expires,
            MaxAge = expires.HasValue ? expires.Value - DateTimeOffset.UtcNow : null,
        };
    }
}
