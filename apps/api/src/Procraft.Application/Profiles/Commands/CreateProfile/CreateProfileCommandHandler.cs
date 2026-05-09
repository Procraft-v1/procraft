using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Profiles.DTOs;
using Procraft.Domain.Entities;

namespace Procraft.Application.Profiles.Commands.CreateProfile;

public sealed class CreateProfileCommandHandler : IRequestHandler<CreateProfileCommand, ProfileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateProfileCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ProfileDto> Handle(CreateProfileCommand request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var user = await _db.Users
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.Id == current.UserId, cancellationToken)
            ?? throw new UnauthorizedException("Not authenticated.");

        if (user.Profile is not null)
        {
            throw new ConflictException(new Dictionary<string, string[]>
            {
                ["profile"] = new[] { "Profile already exists." },
            });
        }

        var now = DateTimeOffset.UtcNow;
        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            FullName = request.FullName.Trim(),
            Title = Normalize(request.Title),
            Bio = Normalize(request.Bio),
            Location = Normalize(request.Location),
            AvatarUrl = Normalize(request.AvatarUrl),
            CreatedAt = now,
        };

        await _db.Profiles.AddAsync(profile, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return ProfileDto.FromProfile(profile);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
