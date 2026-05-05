using MediatR;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.UploadProfileAvatar;

public sealed record UploadProfileAvatarCommand(
    Stream? FileStream,
    string? FileName,
    string? ContentType,
    long FileSizeBytes) : IRequest<ProfileDto>;
