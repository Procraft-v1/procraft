using FluentValidation;

namespace Procraft.Application.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.ResetId)
            .NotEmpty();

        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches("^\\d{4}$");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(100);
    }
}
