using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.SelectProfileTemplate;

public sealed class SelectProfileTemplateCommandHandler : IRequestHandler<SelectProfileTemplateCommand, ProfileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public SelectProfileTemplateCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ProfileDto> Handle(SelectProfileTemplateCommand request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var template = await _db.Templates
            .FirstOrDefaultAsync(x => x.Id == request.TemplateId && x.IsActive, cancellationToken)
            ?? throw new NotFoundException("Template not found.");

        var profile = await _db.Profiles
            .Include(x => x.User)
            .Include(x => x.Template)
            .FirstOrDefaultAsync(x => x.UserId == current.UserId, cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        profile.TemplateId = template.Id;
        profile.Template = template;
        profile.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return ProfileDto.FromProfile(profile);
    }
}
