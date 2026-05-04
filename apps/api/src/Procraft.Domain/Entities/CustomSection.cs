namespace Procraft.Domain.Entities;

public sealed class CustomSection : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;
}
