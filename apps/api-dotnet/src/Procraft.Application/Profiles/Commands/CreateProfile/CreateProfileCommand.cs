using MediatR;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.CreateProfile;

public sealed record CreateProfileCommand(
    string FullName,
    string? Title,
    string? Bio,
    string? Location,
    string? AvatarUrl) : IRequest<ProfileDto>;
