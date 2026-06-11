using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.Auth.Queries.Me;

public sealed class MeQueryHandler : IRequestHandler<MeQuery, AuthResultDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public MeQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<AuthResultDto> Handle(MeQuery _, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser();
        if (current is null)
        {
            throw new UnauthorizedException("Not authenticated.");
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == current.UserId, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedException("Not authenticated.");
        }

        return new AuthResultDto
        {
            User = AuthUserDto.FromUser(user),
        };
    }
}
