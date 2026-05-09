namespace Procraft.Application.Common.Security;

public sealed class AuthCookieOptions
{
    public string AccessCookieName { get; set; } = CookieNames.Access;

    public string RefreshCookieName { get; set; } = CookieNames.Refresh;

    public string CsrfCookieName { get; set; } = CookieNames.Csrf;

    public string? CsrfCookieDomain { get; set; }

    public string SameSite { get; set; } = "Lax";

    public bool Secure { get; set; }
}
