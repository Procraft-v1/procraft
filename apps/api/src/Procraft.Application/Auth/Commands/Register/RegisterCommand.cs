using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.Register;

public sealed record RegisterCommand(string Email, string Username, string Password) : IRequest<AuthResultDto>;
