using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.VerifyLogin;

public sealed record VerifyLoginCommand(Guid VerificationId, string Code) : IRequest<AuthResultDto>;
