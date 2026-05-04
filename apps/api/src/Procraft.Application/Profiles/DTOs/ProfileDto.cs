using Procraft.Domain.Entities;

namespace Procraft.Application.Profiles.DTOs;

public sealed class ProfileDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public Guid? TemplateId { get; init; }

    public string Username { get; init; } = string.Empty;

    public string FullName { get; init; } = string.Empty;

    public string? Title { get; init; }

    public string? Bio { get; init; }

    public string? Location { get; init; }

    public string? Website { get; init; }

    public string? AvatarUrl { get; init; }

    public string TemplateSlug { get; init; } = "minimal";

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset? UpdatedAt { get; init; }

    public static ProfileDto FromProfile(Profile profile) =>
        new()
        {
            Id = profile.Id,
            UserId = profile.UserId,
            TemplateId = profile.TemplateId,
            Username = profile.User.Username,
            FullName = profile.FullName,
            Title = profile.Title,
            Bio = profile.Bio,
            Location = profile.Location,
            Website = profile.Website,
            AvatarUrl = profile.AvatarUrl,
            TemplateSlug = profile.Template?.Slug ?? "minimal",
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
        };
}
