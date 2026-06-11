using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Analytics.DTOs;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;

namespace Procraft.Application.Analytics.Queries.GetAnalyticsSummary;

public sealed class GetAnalyticsSummaryQueryHandler : IRequestHandler<GetAnalyticsSummaryQuery, AnalyticsSummaryDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetAnalyticsSummaryQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<AnalyticsSummaryDto> Handle(GetAnalyticsSummaryQuery request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var profileId = await _db.Profiles.AsNoTracking()
            .Where(x => x.UserId == current.UserId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!profileId.HasValue)
        {
            return new AnalyticsSummaryDto(0, 0, Array.Empty<CountryCountDto>(), Array.Empty<DateCountDto>(), Array.Empty<RecentVisitorDto>());
        }

        var events = await _db.AnalyticsEvents.AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var cutoff = DateTimeOffset.UtcNow.AddDays(-30);
        var last30 = events.Where(x => x.CreatedAt >= cutoff).ToList();
        var metadata = events.Select(ReadMetadata).ToList();

        var topCountries = metadata
            .Where(x => !string.IsNullOrWhiteSpace(x.Country))
            .GroupBy(x => x.Country)
            .Select(x => new CountryCountDto(x.Key, x.Count()))
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToArray();

        var viewsByDate = last30
            .GroupBy(x => x.CreatedAt.UtcDateTime.Date)
            .Select(x => new DateCountDto(x.Key.ToString("yyyy-MM-dd"), x.Count()))
            .OrderBy(x => x.Date)
            .ToArray();

        var recentVisitors = events
            .Take(10)
            .Select(x =>
            {
                var item = ReadMetadata(x);
                var minutes = Math.Max(1, (int)(DateTimeOffset.UtcNow - x.CreatedAt).TotalMinutes);
                return new RecentVisitorDto(item.City, item.Country, $"{minutes} minutes ago");
            })
            .ToArray();

        return new AnalyticsSummaryDto(events.Count, last30.Count, topCountries, viewsByDate, recentVisitors);
    }

    private static AnalyticsMetadata ReadMetadata(AnalyticsEvent item)
    {
        if (string.IsNullOrWhiteSpace(item.Metadata))
        {
            return new AnalyticsMetadata(null, null, null, "Unknown", "Unknown");
        }

        try
        {
            return JsonSerializer.Deserialize<AnalyticsMetadata>(item.Metadata)
                ?? new AnalyticsMetadata(null, null, null, "Unknown", "Unknown");
        }
        catch (JsonException)
        {
            return new AnalyticsMetadata(null, null, null, "Unknown", "Unknown");
        }
    }
}
