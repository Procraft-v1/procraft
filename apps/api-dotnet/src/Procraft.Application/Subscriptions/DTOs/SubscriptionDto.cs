using Procraft.Domain.Entities;

namespace Procraft.Application.Subscriptions.DTOs;

public sealed record SubscriptionDto(
    Guid Id,
    Guid UserId,
    string PlanKey,
    string Status,
    DateTimeOffset? CurrentPeriodEnd,
    DateTimeOffset CreatedAt)
{
    public static SubscriptionDto FromEntity(Subscription subscription) =>
        new(
            subscription.Id,
            subscription.UserId,
            subscription.PlanKey,
            subscription.Status.ToString(),
            subscription.CurrentPeriodEnd,
            subscription.CreatedAt);

    public static SubscriptionDto Trial(Guid userId) =>
        new(Guid.Empty, userId, "trial", "Trial", DateTimeOffset.UtcNow.AddDays(30), DateTimeOffset.UtcNow);
}
