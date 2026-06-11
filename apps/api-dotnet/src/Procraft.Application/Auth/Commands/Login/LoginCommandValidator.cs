using FluentValidation;

namespace Procraft.Application.Auth.Commands.Login;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.EmailOrUsername)
            .NotEmpty()
            .Must(s => !string.IsNullOrWhiteSpace(s));

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}
