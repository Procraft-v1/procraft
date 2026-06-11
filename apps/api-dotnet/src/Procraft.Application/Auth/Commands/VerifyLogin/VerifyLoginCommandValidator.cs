using FluentValidation;

namespace Procraft.Application.Auth.Commands.VerifyLogin;

public sealed class VerifyLoginCommandValidator : AbstractValidator<VerifyLoginCommand>
{
    public VerifyLoginCommandValidator()
    {
        RuleFor(x => x.VerificationId)
            .NotEmpty();

        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches("^\\d{4}$");
    }
}
