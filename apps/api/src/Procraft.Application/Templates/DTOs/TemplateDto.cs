using Procraft.Domain.Entities;

namespace Procraft.Application.Templates.DTOs;

public sealed class TemplateDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string? PreviewUrl { get; init; }

    public bool IsActive { get; init; }

    public bool IsPremium { get; init; }

    public static TemplateDto FromTemplate(Template template) =>
        new()
        {
            Id = template.Id,
            Name = template.Name,
            Slug = template.Slug,
            PreviewUrl = template.PreviewUrl,
            IsActive = template.IsActive,
            IsPremium = template.IsPremium,
        };
}
