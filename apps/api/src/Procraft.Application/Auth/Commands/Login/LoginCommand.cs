using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.Login;

public sealed record LoginCommand(string EmailOrUsername, string Password) : IRequest<LoginChallengeDto>;
