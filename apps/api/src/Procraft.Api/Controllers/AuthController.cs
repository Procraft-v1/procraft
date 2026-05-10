using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.Auth.Commands.Login;
using Procraft.Application.Auth.Commands.Logout;
using Procraft.Application.Auth.Commands.RefreshToken;
using Procraft.Application.Auth.Commands.Register;
using Procraft.Application.Auth.Commands.RequestPasswordReset;
using Procraft.Application.Auth.Commands.ResetPassword;
using Procraft.Application.Auth.Commands.VerifyLogin;
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
        return Ok(new
        {
            requiresVerification = true,
            verificationId = result.VerificationId,
            maskedEmail = result.MaskedEmail,
            expiresAt = result.ExpiresAt,
            codeLength = result.CodeLength,
        });
    }

    [HttpPost("login/verify")]
    [AllowAnonymous]
    public async Task<ActionResult> VerifyLoginAsync([FromBody] VerifyLoginApiRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new VerifyLoginCommand(request.VerificationId, request.Code), cancellationToken);
        return Ok(new { user = result.User });
    }

    [HttpPost("password/forgot")]
    [AllowAnonymous]
    public async Task<ActionResult> ForgotPasswordAsync([FromBody] ForgotPasswordApiRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new RequestPasswordResetCommand(request.Email), cancellationToken);
        return Ok(new
        {
            resetId = result.ResetId,
            maskedEmail = result.MaskedEmail,
            expiresAt = result.ExpiresAt,
            codeLength = result.CodeLength,
        });
    }

    [HttpPost("password/reset")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPasswordAsync([FromBody] ResetPasswordApiRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ResetPasswordCommand(request.ResetId, request.Code, request.NewPassword), cancellationToken);
        return Ok(new { message = result.Message });
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

public sealed record VerifyLoginApiRequest(Guid VerificationId, string Code);

public sealed record ForgotPasswordApiRequest(string Email);

public sealed record ResetPasswordApiRequest(Guid ResetId, string Code, string NewPassword);
