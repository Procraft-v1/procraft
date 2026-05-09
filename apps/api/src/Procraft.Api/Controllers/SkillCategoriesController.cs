using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.SkillCategories;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/skill-categories")]
public sealed class SkillCategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public SkillCategoriesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetSkillCategoriesQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] SkillCategoryApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateSkillCategoryCommand(request.Name, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] SkillCategoryApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateSkillCategoryCommand(id, request.Name, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteSkillCategoryCommand(id), cancellationToken));
}

public sealed record SkillCategoryApiRequest(string Name, int? SortOrder);
