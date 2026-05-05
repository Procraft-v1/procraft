using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using Procraft.Domain.Entities;

namespace Procraft.Application.ProfileSections.Experiences;

public sealed record ExperienceDto(Guid Id, string Company, string Position, string? Description, DateOnly StartDate, DateOnly? EndDate, bool IsCurrent, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static ExperienceDto FromEntity(WorkExperience item) =>
        new(item.Id, item.Company, item.Position, item.Description, item.StartDate, item.EndDate, item.IsCurrent, item.SortOrder, item.CreatedAt, item.UpdatedAt);
}

public sealed record GetExperiencesQuery : IRequest<IReadOnlyCollection<ExperienceDto>>;
public sealed record CreateExperienceCommand(string Company, string Position, string? Description, DateOnly StartDate, DateOnly? EndDate, bool IsCurrent, int? SortOrder) : IRequest<ExperienceDto>;
public sealed record UpdateExperienceCommand(Guid Id, string Company, string Position, string? Description, DateOnly StartDate, DateOnly? EndDate, bool IsCurrent, int? SortOrder) : IRequest<ExperienceDto>;
public sealed record DeleteExperienceCommand(Guid Id) : IRequest<ExperienceDto>;

public sealed class CreateExperienceCommandValidator : AbstractValidator<CreateExperienceCommand>
{
    public CreateExperienceCommandValidator()
    {
        RuleFor(x => x.Company).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Position).NotEmpty().MaximumLength(200);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.EndDate)
            .Must((x, endDate) => !endDate.HasValue || endDate.Value >= x.StartDate)
            .WithMessage("End date must be greater than or equal to start date.");
    }
}

public sealed class UpdateExperienceCommandValidator : AbstractValidator<UpdateExperienceCommand>
{
    public UpdateExperienceCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Company).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Position).NotEmpty().MaximumLength(200);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.EndDate)
            .Must((x, endDate) => !endDate.HasValue || endDate.Value >= x.StartDate)
            .WithMessage("End date must be greater than or equal to start date.");
    }
}

public sealed class DeleteExperienceCommandValidator : AbstractValidator<DeleteExperienceCommand>
{
    public DeleteExperienceCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetExperiencesQueryHandler : IRequestHandler<GetExperiencesQuery, IReadOnlyCollection<ExperienceDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetExperiencesQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<ExperienceDto>> Handle(GetExperiencesQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var items = await _db.WorkExperiences.AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.StartDate)
            .ToListAsync(cancellationToken);
        return items.Select(ExperienceDto.FromEntity).ToArray();
    }
}

public sealed class CreateExperienceCommandHandler : IRequestHandler<CreateExperienceCommand, ExperienceDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateExperienceCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ExperienceDto> Handle(CreateExperienceCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = new WorkExperience
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Company = request.Company.Trim(),
            Position = request.Position.Trim(),
            Description = Normalize(request.Description),
            StartDate = request.StartDate,
            EndDate = request.IsCurrent ? null : request.EndDate,
            IsCurrent = request.IsCurrent,
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        await _db.WorkExperiences.AddAsync(item, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return ExperienceDto.FromEntity(item);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class UpdateExperienceCommandHandler : IRequestHandler<UpdateExperienceCommand, ExperienceDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateExperienceCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ExperienceDto> Handle(UpdateExperienceCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.WorkExperiences.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Experience not found.");
        item.Company = request.Company.Trim();
        item.Position = request.Position.Trim();
        item.Description = Normalize(request.Description);
        item.StartDate = request.StartDate;
        item.EndDate = request.IsCurrent ? null : request.EndDate;
        item.IsCurrent = request.IsCurrent;
        item.SortOrder = request.SortOrder ?? item.SortOrder;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ExperienceDto.FromEntity(item);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class DeleteExperienceCommandHandler : IRequestHandler<DeleteExperienceCommand, ExperienceDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteExperienceCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ExperienceDto> Handle(DeleteExperienceCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.WorkExperiences.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Experience not found.");
        var dto = ExperienceDto.FromEntity(item);
        _db.WorkExperiences.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
