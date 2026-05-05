namespace Procraft.Application.Common.Interfaces;

public interface IPdfService
{
    Task<byte[]> GenerateResumeAsync(PdfResumeModel resume, CancellationToken cancellationToken = default);
}

public sealed record PdfResumeModel(
    string FullName,
    string? Title,
    string? Summary,
    string? Location,
    string? Website,
    IReadOnlyCollection<PdfSkillModel> Skills,
    IReadOnlyCollection<PdfProjectModel> Projects,
    IReadOnlyCollection<PdfExperienceModel> Experiences,
    IReadOnlyCollection<PdfEducationModel> Educations,
    IReadOnlyCollection<PdfCertificateModel> Certificates,
    IReadOnlyCollection<PdfSocialLinkModel> SocialLinks,
    string? TemplateSlug);

public sealed record PdfSkillModel(string Name, byte? Level, string? Category);

public sealed record PdfProjectModel(string Name, string? Description, string? GithubUrl, string? LiveUrl);

public sealed record PdfExperienceModel(
    string Company,
    string Position,
    string? Description,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent);

public sealed record PdfEducationModel(
    string Institution,
    string? Degree,
    string? Field,
    DateOnly? StartDate,
    DateOnly? EndDate);

public sealed record PdfCertificateModel(string Name, string? Issuer, DateOnly? IssuedOn, string? Url);

public sealed record PdfSocialLinkModel(string Platform, string Url);
