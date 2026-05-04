using MediatR;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(
    string FullName,
    string? Title,
    string? Bio,
    string? Location,
    string? Website,
    string? AvatarUrl) : IRequest<ProfileDto>;
