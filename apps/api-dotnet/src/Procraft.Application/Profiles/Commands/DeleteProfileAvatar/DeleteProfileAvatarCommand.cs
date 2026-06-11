using MediatR;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.DeleteProfileAvatar;

public sealed record DeleteProfileAvatarCommand : IRequest<ProfileDto>;
