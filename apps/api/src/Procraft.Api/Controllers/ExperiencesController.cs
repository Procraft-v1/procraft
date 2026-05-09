using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.Experiences;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/experiences")]
public sealed class ExperiencesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ExperiencesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetExperiencesQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] ExperienceApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateExperienceCommand(request.Company, request.ExperienceType, request.Position, request.Description, request.StartDate, request.EndDate, request.IsCurrent, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] ExperienceApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateExperienceCommand(id, request.Company, request.ExperienceType, request.Position, request.Description, request.StartDate, request.EndDate, request.IsCurrent, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteExperienceCommand(id), cancellationToken));
}

public sealed record ExperienceApiRequest(
    string Company,
    string ExperienceType,
    string Position,
    string? Description,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    int? SortOrder);
