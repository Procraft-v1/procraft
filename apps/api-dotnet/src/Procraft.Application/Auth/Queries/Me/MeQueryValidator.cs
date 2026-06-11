using FluentValidation;

namespace Procraft.Application.Auth.Queries.Me;

public sealed class MeQueryValidator : AbstractValidator<MeQuery>
{
    public MeQueryValidator()
    {
    }
}
