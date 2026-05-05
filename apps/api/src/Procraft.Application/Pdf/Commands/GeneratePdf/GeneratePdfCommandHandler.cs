using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.Pdf.Commands.GeneratePdf;

public sealed class GeneratePdfCommandHandler : IRequestHandler<GeneratePdfCommand, GeneratedPdfFile>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPdfService _pdfService;

    public GeneratePdfCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUserService,
        IPdfService pdfService)
    {
        _db = db;
        _currentUserService = currentUserService;
        _pdfService = pdfService;
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
            .Select(x => new PdfProjectModel(x.Name, x.Description, x.GithubUrl, x.LiveUrl))
            .ToListAsync(cancellationToken);

        var experiences = await _db.WorkExperiences.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.StartDate)
            .Select(x => new PdfExperienceModel(x.Company, x.Position, x.Description, x.StartDate, x.EndDate, x.IsCurrent))
            .ToListAsync(cancellationToken);

        var educations = await _db.Educations.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.StartDate)
            .Select(x => new PdfEducationModel(x.Institution, x.Degree, x.Field, x.StartDate, x.EndDate))
            .ToListAsync(cancellationToken);

        var certificates = await _db.Certificates.AsNoTracking()
            .Where(x => x.ProfileId == profile.Id)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.IssuedOn)
            .Select(x => new PdfCertificateModel(x.Name, x.Issuer, x.IssuedOn, x.Url))
            .ToListAsync(cancellationToken);

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
            profile.Website,
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
}
