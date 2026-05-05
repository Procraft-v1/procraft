namespace Procraft.Domain.Entities;

public sealed class Profile : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public Guid? TemplateId { get; set; }

    public Template? Template { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string? Title { get; set; }

    public string? Bio { get; set; }

    public string? Location { get; set; }

    public string? Website { get; set; }

    public string? AvatarUrl { get; set; }

    public ICollection<Skill> Skills { get; set; } = new List<Skill>();

    public ICollection<Project> Projects { get; set; } = new List<Project>();

    public ICollection<WorkExperience> WorkExperiences { get; set; } = new List<WorkExperience>();

    public ICollection<Education> Educations { get; set; } = new List<Education>();

    public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();

    public ICollection<SocialLink> SocialLinks { get; set; } = new List<SocialLink>();

    public ICollection<CustomSection> CustomSections { get; set; } = new List<CustomSection>();

    public ICollection<AnalyticsEvent> AnalyticsEvents { get; set; } = new List<AnalyticsEvent>();

    public ICollection<PdfExport> PdfExports { get; set; } = new List<PdfExport>();
}
