using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using Procraft.Domain.Entities;

namespace Procraft.Application.ProfileSections.SocialLinks;

public sealed record SocialLinkDto(Guid Id, string Platform, string Url, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static SocialLinkDto FromEntity(SocialLink item) =>
        new(item.Id, item.Platform, item.Url, item.SortOrder, item.CreatedAt, item.UpdatedAt);
}

public sealed record GetSocialLinksQuery : IRequest<IReadOnlyCollection<SocialLinkDto>>;
public sealed record CreateSocialLinkCommand(string Platform, string Url, int? SortOrder) : IRequest<SocialLinkDto>;
public sealed record UpdateSocialLinkCommand(Guid Id, string Platform, string Url, int? SortOrder) : IRequest<SocialLinkDto>;
public sealed record DeleteSocialLinkCommand(Guid Id) : IRequest<SocialLinkDto>;

public sealed class CreateSocialLinkCommandValidator : AbstractValidator<CreateSocialLinkCommand>
{
    public CreateSocialLinkCommandValidator()
    {
        RuleFor(x => x.Platform).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Url).NotEmpty().MaximumLength(255);
    }
}

public sealed class UpdateSocialLinkCommandValidator : AbstractValidator<UpdateSocialLinkCommand>
{
    public UpdateSocialLinkCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Platform).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Url).NotEmpty().MaximumLength(255);
    }
}

public sealed class DeleteSocialLinkCommandValidator : AbstractValidator<DeleteSocialLinkCommand>
{
    public DeleteSocialLinkCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetSocialLinksQueryHandler : IRequestHandler<GetSocialLinksQuery, IReadOnlyCollection<SocialLinkDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetSocialLinksQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<SocialLinkDto>> Handle(GetSocialLinksQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var items = await _db.SocialLinks.AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Platform)
            .ToListAsync(cancellationToken);
        return items.Select(SocialLinkDto.FromEntity).ToArray();
    }
}

public sealed class CreateSocialLinkCommandHandler : IRequestHandler<CreateSocialLinkCommand, SocialLinkDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateSocialLinkCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SocialLinkDto> Handle(CreateSocialLinkCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = new SocialLink
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Platform = request.Platform.Trim(),
            Url = request.Url.Trim(),
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        await _db.SocialLinks.AddAsync(item, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return SocialLinkDto.FromEntity(item);
    }
}

public sealed class UpdateSocialLinkCommandHandler : IRequestHandler<UpdateSocialLinkCommand, SocialLinkDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateSocialLinkCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SocialLinkDto> Handle(UpdateSocialLinkCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.SocialLinks.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Social link not found.");
        item.Platform = request.Platform.Trim();
        item.Url = request.Url.Trim();
        item.SortOrder = request.SortOrder ?? item.SortOrder;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return SocialLinkDto.FromEntity(item);
    }
}

public sealed class DeleteSocialLinkCommandHandler : IRequestHandler<DeleteSocialLinkCommand, SocialLinkDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteSocialLinkCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SocialLinkDto> Handle(DeleteSocialLinkCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.SocialLinks.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Social link not found.");
        var dto = SocialLinkDto.FromEntity(item);
        _db.SocialLinks.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
