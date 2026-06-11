using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Auth.DTOs;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.Auth.Commands.UpdateAccount;

public sealed class UpdateAccountCommandHandler : IRequestHandler<UpdateAccountCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateAccountCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<AuthResultDto> Handle(UpdateAccountCommand request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == current.UserId, cancellationToken)
            ?? throw new UnauthorizedException("Not authenticated.");

        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim().ToLowerInvariant();
        var phoneNumber = NormalizePhoneNumber(request.PhoneNumber);

        if (await _db.Users.AsNoTracking().AnyAsync(x => x.Id != user.Id && x.Email == email, cancellationToken))
        {
            throw new ConflictException(new Dictionary<string, string[]>
            {
                ["email"] = new[] { "Email is already taken" },
            });
        }

        if (await _db.Users.AsNoTracking().AnyAsync(x => x.Id != user.Id && x.Username == username, cancellationToken))
        {
            throw new ConflictException(new Dictionary<string, string[]>
            {
                ["username"] = new[] { "Username is already taken" },
            });
        }

        user.Email = email;
        user.Username = username;
        user.PhoneNumber = phoneNumber;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new AuthResultDto
        {
            User = AuthUserDto.FromUser(user),
        };
    }

    private static string? NormalizePhoneNumber(string? phoneNumber)
    {
        var trimmed = phoneNumber?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}
