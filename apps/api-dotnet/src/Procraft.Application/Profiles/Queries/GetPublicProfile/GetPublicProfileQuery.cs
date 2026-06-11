using MediatR;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Queries.GetPublicProfile;

public sealed record GetPublicProfileQuery(string Username) : IRequest<ProfileDto>;
