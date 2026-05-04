namespace Procraft.Domain.Entities;

public sealed class Certificate : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string? Issuer { get; set; }

    public DateOnly? IssuedOn { get; set; }

    public string? CredentialUrl { get; set; }
}
