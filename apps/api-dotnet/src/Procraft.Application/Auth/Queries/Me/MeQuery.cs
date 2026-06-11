using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Queries.Me;

public sealed record MeQuery : IRequest<AuthResultDto>;
