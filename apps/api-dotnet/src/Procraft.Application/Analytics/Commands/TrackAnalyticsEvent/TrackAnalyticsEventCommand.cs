using MediatR;
using Procraft.Application.Analytics.DTOs;

namespace Procraft.Application.Analytics.Commands.TrackAnalyticsEvent;

public sealed record TrackAnalyticsEventCommand(
    Guid ProfileId,
    string? IpAddress,
    string? UserAgent,
    string? Referer) : IRequest<AnalyticsEventDto>;
