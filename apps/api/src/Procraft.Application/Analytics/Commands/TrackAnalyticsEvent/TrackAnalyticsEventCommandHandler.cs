using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Analytics.DTOs;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;
using Procraft.Domain.Enums;

namespace Procraft.Application.Analytics.Commands.TrackAnalyticsEvent;

public sealed class TrackAnalyticsEventCommandHandler : IRequestHandler<TrackAnalyticsEventCommand, AnalyticsEventDto>
{
    private readonly IApplicationDbContext _db;

    public TrackAnalyticsEventCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AnalyticsEventDto> Handle(TrackAnalyticsEventCommand request, CancellationToken cancellationToken)
    {
        var profileExists = await _db.Profiles.AsNoTracking()
            .AnyAsync(x => x.Id == request.ProfileId, cancellationToken);

        if (!profileExists)
        {
            throw new NotFoundException("Profile not found.");
        }

        var now = DateTimeOffset.UtcNow;
        var metadata = new AnalyticsMetadata(
            request.IpAddress,
            request.UserAgent,
            request.Referer,
            "UZ",
            "Tashkent");

        var item = new AnalyticsEvent
        {
            Id = Guid.NewGuid(),
            ProfileId = request.ProfileId,
            EventType = AnalyticsEventType.PageView,
            Path = request.Referer,
            Metadata = JsonSerializer.Serialize(metadata),
            CreatedAt = now,
        };

        await _db.AnalyticsEvents.AddAsync(item, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return new AnalyticsEventDto(item.Id, item.ProfileId, item.EventType.ToString(), item.Path, item.CreatedAt);
    }
}
