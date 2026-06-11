namespace Procraft.Domain.Entities;

public sealed class Project : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? GithubUrl { get; set; }

    public bool IsRepositoryPrivate { get; set; }

    public string? LiveUrl { get; set; }

    public int SortOrder { get; set; }
}
