using FluentValidation;

namespace Procraft.Application.Auth.Commands.Register;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();

        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(30)
            .Matches("^[a-z0-9_-]+$")
            .WithMessage("Username may only contain lowercase letters, digits, hyphen, or underscore.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(100);

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(32)
            .Matches(@"^\+?[0-9\s().-]{7,32}$")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber))
            .WithMessage("Phone number may contain digits, spaces, plus, dots, hyphen, or parentheses.");
    }
}
