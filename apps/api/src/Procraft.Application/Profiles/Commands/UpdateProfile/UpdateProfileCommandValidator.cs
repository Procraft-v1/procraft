using FluentValidation;

namespace Procraft.Application.Profiles.Commands.UpdateProfile;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Title).MaximumLength(100);
        RuleFor(x => x.Bio).MaximumLength(1000);
        RuleFor(x => x.Location).MaximumLength(160);
        RuleFor(x => x.Website).MaximumLength(2048);
        RuleFor(x => x.AvatarUrl).MaximumLength(2048);
    }
}
