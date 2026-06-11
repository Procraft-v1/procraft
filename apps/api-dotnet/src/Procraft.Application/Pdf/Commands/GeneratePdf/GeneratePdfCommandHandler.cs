using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.Pdf.Commands.GeneratePdf;

public sealed class GeneratePdfCommandHandler : IRequestHandler<GeneratePdfCommand, GeneratedPdfFile>
{
    private const string FallbackApiOrigin = "https://api.procraft.uz";

    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPdfService _pdfService;
    private readonly IRequestContext _requestContext;

    public GeneratePdfCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUserService,
        IPdfService pdfService,
        IRequestContext requestContext)
    {
        _db = db;
        _currentUserService = currentUserService;
        _pdfService = pdfService;
        _requestContext = requestContext;
    }

    public async Task<GeneratedPdfFile> Handle(GeneratePdfCommand request, CancellationToken cancellationToken)
    {
        var current = _currentUserService.GetCurrentUser()
            ?? throw new UnauthorizedException("Not authenticated.");

        var profile = await _db.Profiles
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Template)
            .FirstOrDefaultAsync(x => x.UserId == current.UserId, cancellationToken)
            ?? throw new NotFoundException("Profile not found.");

        var skills = await _db.Skills.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new PdfSkillModel(x.Name, x.Level, x.Category))
            .ToListAsync(cancellationToken);

        var projects = await _db.Projects.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new PdfProjectModel(x.Name, x.Description, x.GithubUrl, x.IsRepositoryPrivate, x.LiveUrl))
            .ToListAsync(cancellationToken);

        var experiences = await _db.WorkExperiences.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.StartDate)
            .Select(x => new PdfExperienceModel(x.Company, x.ExperienceType, x.Position, x.Description, x.StartDate, x.EndDate, x.IsCurrent))
            .ToListAsync(cancellationToken);

        var educations = await _db.Educations.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.StartDate)
            .Select(x => new PdfEducationModel(x.Institution, x.EducationType, x.Degree, x.Field, x.StartDate, x.EndDate))
            .ToListAsync(cancellationToken);

        var certificateRows = await _db.Certificates.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.IssuedOn)
            .Select(x => new { x.Name, x.Issuer, x.IssuedOn, x.Url })
            .ToListAsync(cancellationToken);

        var certificates = certificateRows
            .Select(x => new PdfCertificateModel(x.Name, x.Issuer, x.IssuedOn, ToPublicUrl(x.Url)))
            .ToList();

        var socialLinks = await _db.SocialLinks.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Platform)
            .Select(x => new PdfSocialLinkModel(x.Platform, x.Url))
            .ToListAsync(cancellationToken);

        var resume = new PdfResumeModel(
            profile.FullName,
            profile.Title,
            profile.Bio,
            profile.Location,
            skills,
            projects,
            experiences,
            educations,
            certificates,
            socialLinks,
            request.TemplateSlug ?? profile.Template?.Slug);

        var content = await _pdfService.GenerateResumeAsync(resume, cancellationToken);
        return new GeneratedPdfFile("resume.pdf", "application/pdf", content);
    }

    private string? ToPublicUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        var trimmed = value.Trim();
        if (Uri.TryCreate(trimmed, UriKind.Absolute, out _))
        {
            return trimmed;
        }

        if (!trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        var origin = string.IsNullOrWhiteSpace(_requestContext.PublicOrigin)
            ? FallbackApiOrigin
            : _requestContext.PublicOrigin.TrimEnd('/');

        return $"{origin}{trimmed}";
    }
}
