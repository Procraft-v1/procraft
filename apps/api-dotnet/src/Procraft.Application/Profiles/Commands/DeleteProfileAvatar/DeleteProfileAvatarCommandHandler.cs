using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.DeleteProfileAvatar;

public sealed class DeleteProfileAvatarCommandHandler : IRequestHandler<DeleteProfileAvatarCommand, ProfileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorage;

    public DeleteProfileAvatarCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorage)
    {
        _db = db;
        _currentUserService = currentUserService;
        _fileStorage = fileStorage;
    }

    public async Task<ProfileDto> Handle(DeleteProfileAvatarCommand request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var profile = await _db.Profiles
            .Include(x => x.User)
            .Include(x => x.Template)
            .FirstOrDefaultAsync(x => x.UserId == current.UserId, cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        var avatarUrl = profile.AvatarUrl;
        profile.AvatarUrl = null;
        profile.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(avatarUrl))
        {
            await _fileStorage.DeleteAsync(avatarUrl, cancellationToken);
        }

        return ProfileDto.FromProfile(profile);
    }
}
