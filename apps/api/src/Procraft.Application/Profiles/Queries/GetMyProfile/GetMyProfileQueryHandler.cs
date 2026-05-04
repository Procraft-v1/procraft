using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Queries.GetMyProfile;

public sealed class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, ProfileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetMyProfileQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var profile = await _db.Profiles
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Template)
            .FirstOrDefaultAsync(x => x.UserId == current.UserId, cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        return ProfileDto.FromProfile(profile);
    }
}
