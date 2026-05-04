using Microsoft.AspNetCore.Http;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Infrastructure.Services;

public sealed class RequestContextService : IRequestContext
{
    private readonly IHttpContextAccessor _http;

    public RequestContextService(IHttpContextAccessor http)
    {
        _http = http;
    }

    public string? IpAddress
    {
        get
        {
            var ctx = _http.HttpContext;
            if (ctx is null)
            {
                return null;
            }

            var forwarded = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
            {
                var first = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .FirstOrDefault();
                if (!string.IsNullOrEmpty(first))
                {
                    return first;
                }
            }

            return ctx.Connection.RemoteIpAddress?.ToString();
        }
    }

    public string? UserAgent => _http.HttpContext?.Request.Headers.UserAgent.FirstOrDefault();
}
