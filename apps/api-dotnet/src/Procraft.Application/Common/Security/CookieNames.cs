namespace Procraft.Application.Common.Security;

/// <summary>
/// Cookie name defaults aligned with reverse proxy + frontend configuration.
/// </summary>
public static class CookieNames
{
    public const string Access = "__Host-procraft_access";

    public const string Refresh = "__Host-procraft_refresh";

    public const string Csrf = "procraft_csrf";
}
