namespace Procraft.Application.Analytics.DTOs;

public sealed record AnalyticsSummaryDto(
    int TotalViews,
    int Last30DaysViews,
    IReadOnlyCollection<CountryCountDto> TopCountries,
    IReadOnlyCollection<DateCountDto> ViewsByDate,
    IReadOnlyCollection<RecentVisitorDto> RecentVisitors);

public sealed record CountryCountDto(string Country, int Count);

public sealed record DateCountDto(string Date, int Count);

public sealed record RecentVisitorDto(string City, string Country, string Time);

public sealed record AnalyticsEventDto(Guid Id, Guid? ProfileId, string EventType, string? Path, DateTimeOffset CreatedAt);

internal sealed record AnalyticsMetadata(string? Ip, string? UserAgent, string? Referer, string Country, string City);
