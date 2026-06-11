using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.DeleteAccount;

public sealed record DeleteAccountCommand : IRequest<LogoutResponseDto>;
