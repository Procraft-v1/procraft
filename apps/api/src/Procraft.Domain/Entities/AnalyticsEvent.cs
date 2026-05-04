using Procraft.Domain.Enums;

namespace Procraft.Domain.Entities;

public sealed class AnalyticsEvent : BaseEntity
{
    public Guid? ProfileId { get; set; }

    public Profile? Profile { get; set; }

    public AnalyticsEventType EventType { get; set; }

    public string? Path { get; set; }

    public string? Metadata { get; set; }
}
