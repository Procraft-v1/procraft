using FluentValidation;

namespace Procraft.Application.Auth.Commands.VerifyRegister;

public sealed class VerifyRegisterCommandValidator : AbstractValidator<VerifyRegisterCommand>
{
    public VerifyRegisterCommandValidator()
    {
        RuleFor(x => x.VerificationId)
            .NotEmpty();

        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches("^\\d{4}$")
            .WithMessage("Code must be 4 digits.");
    }
}
