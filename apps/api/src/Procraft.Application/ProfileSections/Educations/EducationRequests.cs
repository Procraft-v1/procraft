using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using Procraft.Domain.Entities;

namespace Procraft.Application.ProfileSections.Educations;

public sealed record EducationDto(Guid Id, string Institution, string? Degree, string? Field, DateOnly? StartDate, DateOnly? EndDate, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static EducationDto FromEntity(Education item) =>
        new(item.Id, item.Institution, item.Degree, item.Field, item.StartDate, item.EndDate, item.SortOrder, item.CreatedAt, item.UpdatedAt);
}

public sealed record GetEducationsQuery : IRequest<IReadOnlyCollection<EducationDto>>;
public sealed record CreateEducationCommand(string Institution, string? Degree, string? Field, DateOnly? StartDate, DateOnly? EndDate, int? SortOrder) : IRequest<EducationDto>;
public sealed record UpdateEducationCommand(Guid Id, string Institution, string? Degree, string? Field, DateOnly? StartDate, DateOnly? EndDate, int? SortOrder) : IRequest<EducationDto>;
public sealed record DeleteEducationCommand(Guid Id) : IRequest<EducationDto>;

public sealed class CreateEducationCommandValidator : AbstractValidator<CreateEducationCommand>
{
    public CreateEducationCommandValidator()
    {
        RuleFor(x => x.Institution).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Degree).MaximumLength(100);
        RuleFor(x => x.Field).MaximumLength(100);
        RuleFor(x => x.EndDate)
            .Must((x, endDate) => !x.StartDate.HasValue || !endDate.HasValue || endDate.Value >= x.StartDate.Value)
            .WithMessage("End date must be greater than or equal to start date.");
    }
}

public sealed class UpdateEducationCommandValidator : AbstractValidator<UpdateEducationCommand>
{
    public UpdateEducationCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Institution).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Degree).MaximumLength(100);
        RuleFor(x => x.Field).MaximumLength(100);
        RuleFor(x => x.EndDate)
            .Must((x, endDate) => !x.StartDate.HasValue || !endDate.HasValue || endDate.Value >= x.StartDate.Value)
            .WithMessage("End date must be greater than or equal to start date.");
    }
}

public sealed class DeleteEducationCommandValidator : AbstractValidator<DeleteEducationCommand>
{
    public DeleteEducationCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetEducationsQueryHandler : IRequestHandler<GetEducationsQuery, IReadOnlyCollection<EducationDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetEducationsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<EducationDto>> Handle(GetEducationsQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var items = await _db.Educations.AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.StartDate)
            .ToListAsync(cancellationToken);
        return items.Select(EducationDto.FromEntity).ToArray();
    }
}

public sealed class CreateEducationCommandHandler : IRequestHandler<CreateEducationCommand, EducationDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateEducationCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<EducationDto> Handle(CreateEducationCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = new Education
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Institution = request.Institution.Trim(),
            Degree = Normalize(request.Degree),
            Field = Normalize(request.Field),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        await _db.Educations.AddAsync(item, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return EducationDto.FromEntity(item);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class UpdateEducationCommandHandler : IRequestHandler<UpdateEducationCommand, EducationDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateEducationCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<EducationDto> Handle(UpdateEducationCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.Educations.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Education not found.");
        item.Institution = request.Institution.Trim();
        item.Degree = Normalize(request.Degree);
        item.Field = Normalize(request.Field);
        item.StartDate = request.StartDate;
        item.EndDate = request.EndDate;
        item.SortOrder = request.SortOrder ?? item.SortOrder;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return EducationDto.FromEntity(item);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class DeleteEducationCommandHandler : IRequestHandler<DeleteEducationCommand, EducationDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteEducationCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<EducationDto> Handle(DeleteEducationCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.Educations.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Education not found.");
        var dto = EducationDto.FromEntity(item);
        _db.Educations.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
