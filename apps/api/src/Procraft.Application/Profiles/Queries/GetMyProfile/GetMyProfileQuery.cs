using MediatR;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Queries.GetMyProfile;

public sealed record GetMyProfileQuery : IRequest<ProfileDto>;
