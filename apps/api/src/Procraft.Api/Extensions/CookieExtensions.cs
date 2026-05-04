using Microsoft.Extensions.Options;
using Procraft.Application.Common.Security;

namespace Procraft.Api.Extensions;

public static class CookieExtensions
{
    /// <summary>
    /// Issues a readable CSRF token cookie intended for SPA double-submit parity (non-HttpOnly).
    /// </summary>
    public static void IssueCsrfTokenCookie(HttpContext context)
    {
        var optionsMonitor = context.RequestServices.GetRequiredService<IOptions<AuthCookieOptions>>();
        var options = optionsMonitor.Value;

        var token = Convert.ToHexString(Guid.NewGuid().ToByteArray());
        context.Response.Cookies.Append(
            options.CsrfCookieName,
            token,
            new CookieOptions
            {
                HttpOnly = false,
                Secure = options.Secure,
                SameSite = ParseSameSite(options.SameSite),
                Path = "/",
            });
    }

    private static SameSiteMode ParseSameSite(string value) =>
        Enum.TryParse<SameSiteMode>(value, true, out var parsed) ? parsed : SameSiteMode.Lax;
}
