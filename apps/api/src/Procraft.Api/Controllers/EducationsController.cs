using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.Educations;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/educations")]
public sealed class EducationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EducationsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetEducationsQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] EducationApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateEducationCommand(request.Institution, request.EducationType, request.Degree, request.Field, request.StartDate, request.EndDate, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] EducationApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateEducationCommand(id, request.Institution, request.EducationType, request.Degree, request.Field, request.StartDate, request.EndDate, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteEducationCommand(id), cancellationToken));
}

public sealed record EducationApiRequest(string Institution, string EducationType, string? Degree, string? Field, DateOnly? StartDate, DateOnly? EndDate, int? SortOrder);
