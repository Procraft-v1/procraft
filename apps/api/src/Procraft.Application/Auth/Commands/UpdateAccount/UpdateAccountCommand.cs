using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.UpdateAccount;

public sealed record UpdateAccountCommand(string Email, string Username, string? PhoneNumber) : IRequest<AuthResultDto>;
