using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.Auth.Commands.DeleteAccount;

public sealed class DeleteAccountCommandHandler : IRequestHandler<DeleteAccountCommand, LogoutResponseDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICookieService _cookies;
    private readonly ICurrentUserService _currentUserService;

    public DeleteAccountCommandHandler(
        IApplicationDbContext db,
        ICookieService cookies,
        ICurrentUserService currentUserService)
    {
        _db = db;
        _cookies = cookies;
        _currentUserService = currentUserService;
    }

    public async Task<LogoutResponseDto> Handle(DeleteAccountCommand _, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser();
        if (current is null)
        {
            throw new UnauthorizedException("Not authenticated.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == current.UserId, cancellationToken);
        if (user is null)
        {
            _cookies.ClearAuthCookies();
            throw new UnauthorizedException("Not authenticated.");
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(cancellationToken);
        _cookies.ClearAuthCookies();

        return new LogoutResponseDto
        {
            Message = "Account deleted successfully",
        };
    }
}
