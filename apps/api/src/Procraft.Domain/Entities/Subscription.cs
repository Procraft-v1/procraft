using Procraft.Domain.Enums;

namespace Procraft.Domain.Entities;

public sealed class Subscription : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string PlanKey { get; set; } = string.Empty;

    public SubscriptionStatus Status { get; set; }

    public DateTimeOffset? CurrentPeriodEnd { get; set; }

    public ICollection<PaymentRequest> PaymentRequests { get; set; } = new List<PaymentRequest>();
}
