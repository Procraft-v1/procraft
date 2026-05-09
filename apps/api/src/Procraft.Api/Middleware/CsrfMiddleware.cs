using Microsoft.Extensions.Options;
using Procraft.Application.Common.Security;

namespace Procraft.Api.Middleware;

/// <summary>
/// CSRF guard scaffold — compares header token with readable cookie once dual-submit policy is finalized.
/// </summary>
public sealed class CsrfMiddleware
{
    private readonly RequestDelegate _next;
    private readonly AuthCookieOptions _options;

    public CsrfMiddleware(RequestDelegate next, IOptions<AuthCookieOptions> options)
    {
        _next = next;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (ShouldSkip(context))
        {
            await _next(context);
            return;
        }

        if (!RequiresCsrf(context.Request))
        {
            await _next(context);
            return;
        }

        var cookieName = _options.CsrfCookieName;
        var cookie = context.Request.Cookies[cookieName];
        context.Request.Headers.TryGetValue(CsrfConstants.HeaderName, out var headerValues);
        var header = headerValues.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(cookie) || string.IsNullOrWhiteSpace(header))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new
            {
                title = "CSRF validation failed",
                detail = $"Provide {CsrfConstants.HeaderName} matching {cookieName} cookie.",
            });
            return;
        }

        if (!string.Equals(cookie, header, StringComparison.Ordinal))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { title = "CSRF token mismatch" });
            return;
        }

        await _next(context);
    }

    private static bool ShouldSkip(HttpContext context)
    {
        if (HttpMethods.IsOptions(context.Request.Method) || HttpMethods.IsHead(context.Request.Method))
        {
            return true;
        }

        if (context.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (context.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static bool RequiresCsrf(HttpRequest request)
    {
        return HttpMethods.IsPost(request.Method)
            || HttpMethods.IsPut(request.Method)
            || HttpMethods.IsPatch(request.Method)
            || HttpMethods.IsDelete(request.Method);
    }
}
