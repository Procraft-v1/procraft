namespace Procraft.Domain.Entities;

public sealed class Skill : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public byte? Level { get; set; }

    public string? Category { get; set; }

    public int SortOrder { get; set; }
}
