using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.Projects;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/projects")]
public sealed class ProjectsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetProjectsQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] ProjectApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateProjectCommand(request.Name, request.Description, request.GithubUrl, request.LiveUrl, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] ProjectApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateProjectCommand(id, request.Name, request.Description, request.GithubUrl, request.LiveUrl, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteProjectCommand(id), cancellationToken));
}

public sealed record ProjectApiRequest(string Name, string? Description, string? GithubUrl, string? LiveUrl, int? SortOrder);
