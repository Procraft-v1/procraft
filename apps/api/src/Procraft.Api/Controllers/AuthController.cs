using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.Auth.Commands.Login;
using Procraft.Application.Auth.Commands.Logout;
using Procraft.Application.Auth.Commands.RefreshToken;
using Procraft.Application.Auth.Commands.Register;
using Procraft.Application.Auth.Queries.Me;

namespace Procraft.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("csrf")]
    [AllowAnonymous]
    public IActionResult Csrf()
    {
        Procraft.Api.Extensions.CookieExtensions.IssueCsrfTokenCookie(HttpContext);
        return NoContent();
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> RegisterAsync([FromBody] RegisterApiRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new RegisterCommand(request.Email, request.Username, request.Password), cancellationToken);
        return Ok(new { user = result.User });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> LoginAsync([FromBody] LoginApiRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new LoginCommand(request.EmailOrUsername, request.Password), cancellationToken);
        return Ok(new { user = result.User });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult> MeAsync(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new MeQuery(), cancellationToken);
        return Ok(new { user = result.User });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult> RefreshAsync(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(), cancellationToken);
        return Ok(new { user = result.User });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ActionResult> LogoutAsync(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new LogoutCommand(), cancellationToken);
        return Ok(new { message = result.Message });
    }
}

public sealed record RegisterApiRequest(string Email, string Username, string Password);

public sealed record LoginApiRequest(string EmailOrUsername, string Password);
