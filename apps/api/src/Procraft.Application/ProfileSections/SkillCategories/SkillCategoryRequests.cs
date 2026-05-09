using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using Procraft.Domain.Entities;

namespace Procraft.Application.ProfileSections.SkillCategories;

public sealed record SkillCategoryDto(Guid Id, string Name, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static SkillCategoryDto FromEntity(SkillCategory category) =>
        new(category.Id, category.Name, category.SortOrder, category.CreatedAt, category.UpdatedAt);
}

public sealed record GetSkillCategoriesQuery : IRequest<IReadOnlyCollection<SkillCategoryDto>>;
public sealed record CreateSkillCategoryCommand(string Name, int? SortOrder) : IRequest<SkillCategoryDto>;
public sealed record UpdateSkillCategoryCommand(Guid Id, string Name, int? SortOrder) : IRequest<SkillCategoryDto>;
public sealed record DeleteSkillCategoryCommand(Guid Id) : IRequest<SkillCategoryDto>;

public sealed class CreateSkillCategoryCommandValidator : AbstractValidator<CreateSkillCategoryCommand>
{
    public CreateSkillCategoryCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
    }
}

public sealed class UpdateSkillCategoryCommandValidator : AbstractValidator<UpdateSkillCategoryCommand>
{
    public UpdateSkillCategoryCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
    }
}

public sealed class DeleteSkillCategoryCommandValidator : AbstractValidator<DeleteSkillCategoryCommand>
{
    public DeleteSkillCategoryCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetSkillCategoriesQueryHandler : IRequestHandler<GetSkillCategoriesQuery, IReadOnlyCollection<SkillCategoryDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetSkillCategoriesQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<SkillCategoryDto>> Handle(GetSkillCategoriesQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var categories = await _db.SkillCategories
            .AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return categories.Select(SkillCategoryDto.FromEntity).ToArray();
    }
}

public sealed class CreateSkillCategoryCommandHandler : IRequestHandler<CreateSkillCategoryCommand, SkillCategoryDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateSkillCategoryCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SkillCategoryDto> Handle(CreateSkillCategoryCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var name = Normalize(request.Name);

        var existing = await _db.SkillCategories
            .FirstOrDefaultAsync(x => x.ProfileId == profileId && x.Name == name, cancellationToken);

        if (existing is not null)
        {
            return SkillCategoryDto.FromEntity(existing);
        }

        var category = new SkillCategory
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Name = name,
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        await _db.SkillCategories.AddAsync(category, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return SkillCategoryDto.FromEntity(category);
    }

    private static string Normalize(string value) => value.Trim();
}

public sealed class UpdateSkillCategoryCommandHandler : IRequestHandler<UpdateSkillCategoryCommand, SkillCategoryDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateSkillCategoryCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SkillCategoryDto> Handle(UpdateSkillCategoryCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var category = await _db.SkillCategories
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Skill category not found.");

        category.Name = request.Name.Trim();
        category.SortOrder = request.SortOrder ?? category.SortOrder;
        category.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return SkillCategoryDto.FromEntity(category);
    }
}

public sealed class DeleteSkillCategoryCommandHandler : IRequestHandler<DeleteSkillCategoryCommand, SkillCategoryDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteSkillCategoryCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SkillCategoryDto> Handle(DeleteSkillCategoryCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var category = await _db.SkillCategories
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Skill category not found.");
        var dto = SkillCategoryDto.FromEntity(category);

        _db.SkillCategories.Remove(category);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
