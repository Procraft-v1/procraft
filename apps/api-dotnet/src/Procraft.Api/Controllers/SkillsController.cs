using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.Skills;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/skills")]
public sealed class SkillsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SkillsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetSkillsQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] SkillApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateSkillCommand(request.Name, request.Level, request.Category, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] SkillApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateSkillCommand(id, request.Name, request.Level, request.Category, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteSkillCommand(id), cancellationToken));
}

public sealed record SkillApiRequest(string Name, byte? Level, string? Category, int? SortOrder);
