using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.RefreshToken;

public sealed record RefreshTokenCommand : IRequest<AuthResultDto>;
