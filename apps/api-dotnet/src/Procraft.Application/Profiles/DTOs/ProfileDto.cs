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
    public string? AvatarUrl { get; init; }
    public string TemplateSlug { get; init; } = "minimal";
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }

    public IReadOnlyList<ProfileSkillDto> Skills { get; init; } = [];
    public IReadOnlyList<ProfileProjectDto> Projects { get; init; } = [];
    public IReadOnlyList<ProfileExperienceDto> WorkExperiences { get; init; } = [];
    public IReadOnlyList<ProfileEducationDto> Educations { get; init; } = [];
    public IReadOnlyList<ProfileCertificateDto> Certificates { get; init; } = [];
    public IReadOnlyList<ProfileSocialLinkDto> SocialLinks { get; init; } = [];

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
            AvatarUrl = profile.AvatarUrl,
            TemplateSlug = profile.Template?.Slug ?? "minimal",
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
            Skills = profile.Skills.Select(s => new ProfileSkillDto(s.Id, s.Name, s.Level, s.Category)).ToList(),
            Projects = profile.Projects.Select(p => new ProfileProjectDto(p.Id, p.Name, p.Description, p.GithubUrl, p.IsRepositoryPrivate, p.LiveUrl)).ToList(),
            WorkExperiences = profile.WorkExperiences.Select(e => new ProfileExperienceDto(e.Id, e.Company, e.ExperienceType, e.Position, e.Description, e.StartDate, e.EndDate, e.IsCurrent)).ToList(),
            Educations = profile.Educations.Select(e => new ProfileEducationDto(e.Id, e.Institution, e.EducationType, e.Degree, e.Field, e.StartDate, e.EndDate)).ToList(),
            Certificates = profile.Certificates.Select(c => new ProfileCertificateDto(c.Id, c.Name, c.Issuer, c.IssuedOn, c.Url)).ToList(),
            SocialLinks = profile.SocialLinks.Select(s => new ProfileSocialLinkDto(s.Id, s.Platform, s.Url)).ToList(),
        };
}

public sealed record ProfileSkillDto(Guid Id, string Name, byte? Level, string? Category);
public sealed record ProfileProjectDto(Guid Id, string Name, string? Description, string? GithubUrl, bool IsRepositoryPrivate, string? LiveUrl);
public sealed record ProfileExperienceDto(Guid Id, string Company, string ExperienceType, string Position, string? Description, DateOnly? StartDate, DateOnly? EndDate, bool IsCurrent);
public sealed record ProfileEducationDto(Guid Id, string Institution, string EducationType, string? Degree, string? Field, DateOnly? StartDate, DateOnly? EndDate);
public sealed record ProfileCertificateDto(Guid Id, string Name, string? Issuer, DateOnly? IssuedOn, string? Url);
public sealed record ProfileSocialLinkDto(Guid Id, string Platform, string Url);
