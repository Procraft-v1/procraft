using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.Logout;

public sealed record LogoutCommand : IRequest<LogoutResponseDto>;
