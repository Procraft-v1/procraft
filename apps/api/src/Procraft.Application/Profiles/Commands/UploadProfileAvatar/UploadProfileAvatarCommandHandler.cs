using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.UploadProfileAvatar;

public sealed class UploadProfileAvatarCommandHandler : IRequestHandler<UploadProfileAvatarCommand, ProfileDto>
{
    private const string AvatarsFolder = "avatars";

    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorage;

    public UploadProfileAvatarCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorage)
    {
        _db = db;
        _currentUserService = currentUserService;
        _fileStorage = fileStorage;
    }

    public async Task<ProfileDto> Handle(UploadProfileAvatarCommand request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var profile = await _db.Profiles
            .Include(x => x.User)
            .Include(x => x.Template)
            .FirstOrDefaultAsync(x => x.UserId == current.UserId, cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        var previousAvatarUrl = profile.AvatarUrl;
        var avatarUrl = await _fileStorage.SaveAsync(
            request.FileStream!,
            request.FileName!,
            request.ContentType!,
            AvatarsFolder,
            cancellationToken);

        profile.AvatarUrl = avatarUrl;
        profile.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(previousAvatarUrl))
        {
            await _fileStorage.DeleteAsync(previousAvatarUrl, cancellationToken);
        }

        return ProfileDto.FromProfile(profile);
    }
}
