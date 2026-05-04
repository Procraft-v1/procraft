using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.Templates.DTOs;

namespace Procraft.Application.Templates.Queries.GetTemplates;

public sealed class GetTemplatesQueryHandler : IRequestHandler<GetTemplatesQuery, IReadOnlyCollection<TemplateDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTemplatesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<TemplateDto>> Handle(GetTemplatesQuery request, CancellationToken cancellationToken)
    {
        var templates = await _db.Templates
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return templates.Select(TemplateDto.FromTemplate).ToArray();
    }
}
