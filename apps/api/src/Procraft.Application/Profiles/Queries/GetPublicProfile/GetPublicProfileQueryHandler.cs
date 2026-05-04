using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Queries.GetPublicProfile;

public sealed class GetPublicProfileQueryHandler : IRequestHandler<GetPublicProfileQuery, ProfileDto>
{
    private readonly IApplicationDbContext _db;

    public GetPublicProfileQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ProfileDto> Handle(GetPublicProfileQuery request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim().ToLowerInvariant();

        var profile = await _db.Profiles
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Template)
            .FirstOrDefaultAsync(x => x.User.Username == username, cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        return ProfileDto.FromProfile(profile);
    }
}
