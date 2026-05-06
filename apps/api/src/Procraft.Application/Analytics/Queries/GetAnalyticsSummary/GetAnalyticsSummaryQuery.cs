using MediatR;
using Procraft.Application.Analytics.DTOs;

namespace Procraft.Application.Analytics.Queries.GetAnalyticsSummary;

public sealed record GetAnalyticsSummaryQuery : IRequest<AnalyticsSummaryDto>;
