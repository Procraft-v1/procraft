using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.VerifyRegister;

public sealed record VerifyRegisterCommand(Guid VerificationId, string Code) : IRequest<AuthResultDto>;
