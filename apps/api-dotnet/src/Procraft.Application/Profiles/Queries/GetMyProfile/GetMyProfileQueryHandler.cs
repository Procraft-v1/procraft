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
            .Include(x => x.Skills.OrderBy(s => s.SortOrder).ThenBy(s => s.Name))
            .Include(x => x.Projects.OrderBy(p => p.SortOrder).ThenBy(p => p.Name))
            .Include(x => x.WorkExperiences.OrderBy(e => e.SortOrder).ThenByDescending(e => e.StartDate))
            .Include(x => x.Educations.OrderBy(e => e.SortOrder).ThenByDescending(e => e.StartDate))
            .Include(x => x.Certificates.OrderBy(c => c.SortOrder).ThenByDescending(c => c.IssuedOn))
            .Include(x => x.SocialLinks.OrderBy(s => s.SortOrder).ThenBy(s => s.Platform))
            .FirstOrDefaultAsync(x => x.UserId == current.UserId, cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        return ProfileDto.FromProfile(profile);
    }
}
