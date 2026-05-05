using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using ProjectEntity = Procraft.Domain.Entities.Project;

namespace Procraft.Application.ProfileSections.Projects;

public sealed record ProjectDto(Guid Id, string Name, string? Description, string? GithubUrl, string? LiveUrl, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static ProjectDto FromEntity(ProjectEntity project) =>
        new(project.Id, project.Name, project.Description, project.GithubUrl, project.LiveUrl, project.SortOrder, project.CreatedAt, project.UpdatedAt);
}

public sealed record GetProjectsQuery : IRequest<IReadOnlyCollection<ProjectDto>>;
public sealed record CreateProjectCommand(string Name, string? Description, string? GithubUrl, string? LiveUrl, int? SortOrder) : IRequest<ProjectDto>;
public sealed record UpdateProjectCommand(Guid Id, string Name, string? Description, string? GithubUrl, string? LiveUrl, int? SortOrder) : IRequest<ProjectDto>;
public sealed record DeleteProjectCommand(Guid Id) : IRequest<ProjectDto>;

public sealed class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.GithubUrl).MaximumLength(255);
        RuleFor(x => x.LiveUrl).MaximumLength(255);
    }
}

public sealed class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.GithubUrl).MaximumLength(255);
        RuleFor(x => x.LiveUrl).MaximumLength(255);
    }
}

public sealed class DeleteProjectCommandValidator : AbstractValidator<DeleteProjectCommand>
{
    public DeleteProjectCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, IReadOnlyCollection<ProjectDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var items = await _db.Projects.AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);
        return items.Select(ProjectDto.FromEntity).ToArray();
    }
}

public sealed class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateProjectCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var project = new ProjectEntity
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Name = request.Name.Trim(),
            Description = Normalize(request.Description),
            GithubUrl = Normalize(request.GithubUrl),
            LiveUrl = Normalize(request.LiveUrl),
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        await _db.Projects.AddAsync(project, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return ProjectDto.FromEntity(project);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProjectCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var project = await _db.Projects.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Project not found.");
        project.Name = request.Name.Trim();
        project.Description = Normalize(request.Description);
        project.GithubUrl = Normalize(request.GithubUrl);
        project.LiveUrl = Normalize(request.LiveUrl);
        project.SortOrder = request.SortOrder ?? project.SortOrder;
        project.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ProjectDto.FromEntity(project);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteProjectCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var project = await _db.Projects.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Project not found.");
        var dto = ProjectDto.FromEntity(project);
        _db.Projects.Remove(project);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
