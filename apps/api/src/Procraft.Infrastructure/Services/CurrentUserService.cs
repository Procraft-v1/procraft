using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Common.Models;

namespace Procraft.Infrastructure.Services;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public CurrentUser? GetCurrentUser()
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(id) || !Guid.TryParse(id, out var userId))
        {
            return null;
        }

        return new CurrentUser
        {
            UserId = userId,
            Email = principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
            Username = principal.FindFirstValue(ClaimTypes.Name)
                ?? principal.FindFirstValue("preferred_username")
                ?? string.Empty,
        };
    }
}
