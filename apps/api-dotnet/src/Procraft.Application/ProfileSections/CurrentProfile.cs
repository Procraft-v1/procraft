using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.ProfileSections;

internal static class CurrentProfile
{
    public static async Task<Guid> GetIdAsync(
        IApplicationDbContext db,
        ICurrentUserService currentUserService,
        CancellationToken cancellationToken)
    {
        var current = currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var profile = await db.Profiles
            .AsNoTracking()
            .Where(x => x.UserId == current.UserId)
            .Select(x => new { x.Id })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        return profile.Id;
    }
}
