namespace Procraft.Domain.Entities;

public sealed class Template : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? PreviewUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsPremium { get; set; }

    public ICollection<Profile> Profiles { get; set; } = new List<Profile>();
}
