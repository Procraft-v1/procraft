using Procraft.Domain.Enums;

namespace Procraft.Domain.Entities;

public sealed class PaymentRequest : BaseEntity
{
    public Guid SubscriptionId { get; set; }

    public Subscription Subscription { get; set; } = null!;

    public PaymentType Type { get; set; }

    public PaymentStatus Status { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "UZS";

    public string? ExternalReference { get; set; }
}
