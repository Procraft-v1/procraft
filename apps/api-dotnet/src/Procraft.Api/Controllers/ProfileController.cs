using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.Profiles.Commands.CreateProfile;
using Procraft.Application.Profiles.Commands.DeleteProfileAvatar;
using Procraft.Application.Profiles.Commands.SelectProfileTemplate;
using Procraft.Application.Profiles.Commands.UpdateProfile;
using Procraft.Application.Profiles.Commands.UploadProfileAvatar;
using Procraft.Application.Profiles.Queries.GetMyProfile;
using Procraft.Application.Profiles.Queries.GetPublicProfile;

namespace Procraft.Api.Controllers;

[ApiController]
[Route("api/profile")]
public sealed class ProfileController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProfileController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult> GetMyProfileAsync(CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(new GetMyProfileQuery(), cancellationToken);
        return Ok(profile);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult> CreateProfileAsync([FromBody] ProfileApiRequest request, CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(
            new CreateProfileCommand(
                request.FullName,
                request.Title,
                request.Bio,
                request.Location,
                request.AvatarUrl),
            cancellationToken);

        return Ok(profile);
    }

    [HttpPut]
    [Authorize]
    public async Task<ActionResult> UpdateProfileAsync([FromBody] ProfileApiRequest request, CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(
            new UpdateProfileCommand(
                request.FullName,
                request.Title,
                request.Bio,
                request.Location,
                request.AvatarUrl),
            cancellationToken);

        return Ok(profile);
    }

    [HttpGet("{username}")]
    [AllowAnonymous]
    public async Task<ActionResult> GetPublicProfileAsync([FromRoute] string username, CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(new GetPublicProfileQuery(username), cancellationToken);
        return Ok(profile);
    }

    [HttpPost("template/{templateId:guid}")]
    [Authorize]
    public async Task<ActionResult> SelectTemplateAsync([FromRoute] Guid templateId, CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(new SelectProfileTemplateCommand(templateId), cancellationToken);
        return Ok(profile);
    }

    [HttpPost("avatar")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult> UploadAvatarAsync([FromForm] UploadAvatarApiRequest request, CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(
            new UploadProfileAvatarCommand(
                request.File?.OpenReadStream(),
                request.File?.FileName,
                request.File?.ContentType,
                request.File?.Length ?? 0),
            cancellationToken);

        return Ok(profile);
    }

    [HttpDelete("avatar")]
    [Authorize]
    public async Task<ActionResult> DeleteAvatarAsync(CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(new DeleteProfileAvatarCommand(), cancellationToken);
        return Ok(profile);
    }
}

public sealed record ProfileApiRequest(
    string FullName,
    string? Title,
    string? Bio,
    string? Location,
    string? AvatarUrl);

public sealed class UploadAvatarApiRequest
{
    public IFormFile? File { get; init; }
}
