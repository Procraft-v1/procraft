using MediatR;
using Procraft.Application.Auth.DTOs;

namespace Procraft.Application.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(Guid ResetId, string Code, string NewPassword) : IRequest<PasswordResetResultDto>;
