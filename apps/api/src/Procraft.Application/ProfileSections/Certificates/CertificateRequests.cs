using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Application.ProfileSections;
using Procraft.Domain.Entities;

namespace Procraft.Application.ProfileSections.Certificates;

public sealed record CertificateDto(Guid Id, string Name, string? Issuer, DateOnly? IssuedOn, string? Url, int SortOrder, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static CertificateDto FromEntity(Certificate item) =>
        new(item.Id, item.Name, item.Issuer, item.IssuedOn, item.Url, item.SortOrder, item.CreatedAt, item.UpdatedAt);
}

public sealed record GetCertificatesQuery : IRequest<IReadOnlyCollection<CertificateDto>>;
public sealed record CreateCertificateCommand(string Name, string? Issuer, DateOnly? IssuedOn, string? Url, int? SortOrder) : IRequest<CertificateDto>;
public sealed record UpdateCertificateCommand(Guid Id, string Name, string? Issuer, DateOnly? IssuedOn, string? Url, int? SortOrder) : IRequest<CertificateDto>;
public sealed record DeleteCertificateCommand(Guid Id) : IRequest<CertificateDto>;

public sealed class CreateCertificateCommandValidator : AbstractValidator<CreateCertificateCommand>
{
    public CreateCertificateCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Issuer).MaximumLength(100);
        RuleFor(x => x.Url).MaximumLength(255);
    }
}

public sealed class UpdateCertificateCommandValidator : AbstractValidator<UpdateCertificateCommand>
{
    public UpdateCertificateCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Issuer).MaximumLength(100);
        RuleFor(x => x.Url).MaximumLength(255);
    }
}

public sealed class DeleteCertificateCommandValidator : AbstractValidator<DeleteCertificateCommand>
{
    public DeleteCertificateCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetCertificatesQueryHandler : IRequestHandler<GetCertificatesQuery, IReadOnlyCollection<CertificateDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public GetCertificatesQueryHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<CertificateDto>> Handle(GetCertificatesQuery request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var items = await _db.Certificates.AsNoTracking()
            .Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.IssuedOn)
            .ToListAsync(cancellationToken);
        return items.Select(CertificateDto.FromEntity).ToArray();
    }
}

public sealed class CreateCertificateCommandHandler : IRequestHandler<CreateCertificateCommand, CertificateDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public CreateCertificateCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<CertificateDto> Handle(CreateCertificateCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = new Certificate
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            Name = request.Name.Trim(),
            Issuer = Normalize(request.Issuer),
            IssuedOn = request.IssuedOn,
            Url = Normalize(request.Url),
            SortOrder = request.SortOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        await _db.Certificates.AddAsync(item, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return CertificateDto.FromEntity(item);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class UpdateCertificateCommandHandler : IRequestHandler<UpdateCertificateCommand, CertificateDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCertificateCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<CertificateDto> Handle(UpdateCertificateCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.Certificates.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Certificate not found.");
        item.Name = request.Name.Trim();
        item.Issuer = Normalize(request.Issuer);
        item.IssuedOn = request.IssuedOn;
        item.Url = Normalize(request.Url);
        item.SortOrder = request.SortOrder ?? item.SortOrder;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return CertificateDto.FromEntity(item);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class DeleteCertificateCommandHandler : IRequestHandler<DeleteCertificateCommand, CertificateDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public DeleteCertificateCommandHandler(IApplicationDbContext db, ICurrentUserService currentUserService)
    {
        _db = db;
        _currentUserService = currentUserService;
    }

    public async Task<CertificateDto> Handle(DeleteCertificateCommand request, CancellationToken cancellationToken)
    {
        var profileId = await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);
        var item = await _db.Certificates.FirstOrDefaultAsync(x => x.Id == request.Id && x.ProfileId == profileId, cancellationToken)
            ?? throw new NotFoundException("Certificate not found.");
        var dto = CertificateDto.FromEntity(item);
        _db.Certificates.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return dto;
    }
}
