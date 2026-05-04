namespace Procraft.Domain.Entities;

/// <summary>Portfolio project entry belonging to a profile.</summary>
public sealed class Project : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? Url { get; set; }
}
