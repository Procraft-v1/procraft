namespace Procraft.Application.Common.Interfaces;

/// <summary>HttpOnly auth cookie façade — implemented in Infrastructure with ASP.NET primitives.</summary>
public interface ICookieService
{
    void AppendAccessToken(string jwt);

    void AppendRefreshToken(string plaintextRefreshToken);

    string? GetPlainRefreshToken();

    void ClearAuthCookies();
}
