using Procraft.Domain.Entities;

namespace Procraft.Application.Auth.DTOs;

public sealed class AuthUserDto
{
    public Guid Id { get; init; }

    public string Email { get; init; } = string.Empty;

    public string Username { get; init; } = string.Empty;

    public string? PhoneNumber { get; init; }

    public bool IsEmailConfirmed { get; init; }

    public static AuthUserDto FromUser(User user) =>
        new()
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            PhoneNumber = user.PhoneNumber,
            IsEmailConfirmed = user.IsEmailConfirmed,
        };
}
