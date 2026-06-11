using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using Procraft.Domain.Entities;

namespace Procraft.Application.ProfileSections.CustomSections;

public sealed record CustomSectionDto(Guid Id, string Title, string Content, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static CustomSectionDto FromEntity(CustomSection item) =>
        new(item.Id, item.Title, item.Content, item.SortOrder, item.CreatedAt, item.UpdatedAt);
}

public sealed record GetCustomSectionsQuery : IRequest<IReadOnlyCollection<CustomSectionDto>>;
public sealed record CreateCustomSectionCommand(string Title, string Content, int? SortOrder) : IRequest<CustomSectionDto>;
public sealed record UpdateCustomSectionCommand(Guid Id, string Title, string Content, int? SortOrder) : IRequest<CustomSectionDto>;
public sealed record DeleteCustomSectionCommand(Guid Id) : IRequest<CustomSectionDto>;

public sealed class CreateCustomSectionCommandValidator : AbstractValidator<CreateCustomSectionCommand>
{
    public CreateCustomSectionCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(8000);
    }
}

public sealed class UpdateCustomSectionCommandValidator : AbstractValidator<UpdateCustomSectionCommand>
{
    public UpdateCustomSectionCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(8000);
    }
}

public sealed class DeleteCustomSectionCommandValidator : AbstractValidator<DeleteCustomSectionCommand>
{
    public DeleteCustomSectionCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetCustomSectionsQueryHandler : IRequestHandler<GetCustomSectionsQuery, IReadOnlyCollection<CustomSectionDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomSectionsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<CustomSectionDto>> Handle(GetCustomSectionsQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var items = await _db.CustomSections.AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Title)
            .ToListAsync(cancellationToken);
        return items.Select(CustomSectionDto.FromEntity).ToArray();
    }
}

public sealed class CreateCustomSectionCommandHandler : IRequestHandler<CreateCustomSectionCommand, CustomSectionDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateCustomSectionCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<CustomSectionDto> Handle(CreateCustomSectionCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = new CustomSection
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        await _db.CustomSections.AddAsync(item, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return CustomSectionDto.FromEntity(item);
    }
}

public sealed class UpdateCustomSectionCommandHandler : IRequestHandler<UpdateCustomSectionCommand, CustomSectionDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCustomSectionCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<CustomSectionDto> Handle(UpdateCustomSectionCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.CustomSections.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Custom section not found.");
        item.Title = request.Title.Trim();
        item.Content = request.Content.Trim();
        item.SortOrder = request.SortOrder ?? item.SortOrder;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return CustomSectionDto.FromEntity(item);
    }
}

public sealed class DeleteCustomSectionCommandHandler : IRequestHandler<DeleteCustomSectionCommand, CustomSectionDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteCustomSectionCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<CustomSectionDto> Handle(DeleteCustomSectionCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.CustomSections.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Custom section not found.");
        var dto = CustomSectionDto.FromEntity(item);
        _db.CustomSections.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
