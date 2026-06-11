using FluentValidation;

namespace Procraft.Application.Profiles.Queries.GetPublicProfile;

public sealed class GetPublicProfileQueryValidator : AbstractValidator<GetPublicProfileQuery>
{
    public GetPublicProfileQueryValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(30);
    }
}
