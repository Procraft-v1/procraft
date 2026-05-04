using FluentValidation;

namespace Procraft.Application.Profiles.Commands.SelectProfileTemplate;

public sealed class SelectProfileTemplateCommandValidator : AbstractValidator<SelectProfileTemplateCommand>
{
    public SelectProfileTemplateCommandValidator()
    {
        RuleFor(x => x.TemplateId).NotEmpty();
    }
}
