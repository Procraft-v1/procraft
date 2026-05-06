using MediatR;
using Procraft.Application.Subscriptions.DTOs;

namespace Procraft.Application.Subscriptions.Queries.GetMySubscription;

public sealed record GetMySubscriptionQuery : IRequest<SubscriptionDto>;
