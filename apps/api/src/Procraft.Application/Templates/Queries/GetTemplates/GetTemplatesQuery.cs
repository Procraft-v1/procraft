using MediatR;
using Procraft.Application.Templates.DTOs;

namespace Procraft.Application.Templates.Queries.GetTemplates;

public sealed record GetTemplatesQuery : IRequest<IReadOnlyCollection<TemplateDto>>;
