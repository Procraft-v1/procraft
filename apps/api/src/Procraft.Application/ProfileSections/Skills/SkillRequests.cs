using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using Procraft.Domain.Entities;

namespace Procraft.Application.ProfileSections.Skills;

public sealed record SkillDto(Guid Id, string Name, byte? Level, string? Category, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static SkillDto FromEntity(Skill skill) =>
        new(skill.Id, skill.Name, skill.Level, skill.Category, skill.SortOrder, skill.CreatedAt, skill.UpdatedAt);
}

public sealed record GetSkillsQuery : IRequest<IReadOnlyCollection<SkillDto>>;
public sealed record CreateSkillCommand(string Name, byte? Level, string? Category, int? SortOrder) : IRequest<SkillDto>;
public sealed record UpdateSkillCommand(Guid Id, string Name, byte? Level, string? Category, int? SortOrder) : IRequest<SkillDto>;
public sealed record DeleteSkillCommand(Guid Id) : IRequest<SkillDto>;

public sealed class CreateSkillCommandValidator : AbstractValidator<CreateSkillCommand>
{
    public CreateSkillCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Level)
            .Must(level => !level.HasValue || level.Value is >= 1 and <= 5)
            .WithMessage("Level must be between 1 and 5.");
        RuleFor(x => x.Category).MaximumLength(50);
    }
}

public sealed class UpdateSkillCommandValidator : AbstractValidator<UpdateSkillCommand>
{
    public UpdateSkillCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Level)
            .Must(level => !level.HasValue || level.Value is >= 1 and <= 5)
            .WithMessage("Level must be between 1 and 5.");
        RuleFor(x => x.Category).MaximumLength(50);
    }
}

public sealed class DeleteSkillCommandValidator : AbstractValidator<DeleteSkillCommand>
{
    public DeleteSkillCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetSkillsQueryHandler : IRequestHandler<GetSkillsQuery, IReadOnlyCollection<SkillDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetSkillsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<SkillDto>> Handle(GetSkillsQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var items = await _db.Skills
            .AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return items.Select(SkillDto.FromEntity).ToArray();
    }
}

public sealed class CreateSkillCommandHandler : IRequestHandler<CreateSkillCommand, SkillDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateSkillCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SkillDto> Handle(CreateSkillCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var skill = new Skill
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Name = request.Name.Trim(),
            Level = request.Level,
            Category = Normalize(request.Category),
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = now,
        };

        await _db.Skills.AddAsync(skill, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return SkillDto.FromEntity(skill);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class UpdateSkillCommandHandler : IRequestHandler<UpdateSkillCommand, SkillDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateSkillCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SkillDto> Handle(UpdateSkillCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var skill = await _db.Skills.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Skill not found.");

        skill.Name = request.Name.Trim();
        skill.Level = request.Level;
        skill.Category = Normalize(request.Category);
        skill.SortOrder = request.SortOrder ?? skill.SortOrder;
        skill.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return SkillDto.FromEntity(skill);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class DeleteSkillCommandHandler : IRequestHandler<DeleteSkillCommand, SkillDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteSkillCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<SkillDto> Handle(DeleteSkillCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var skill = await _db.Skills.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Skill not found.");
        var dto = SkillDto.FromEntity(skill);

        _db.Skills.Remove(skill);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
