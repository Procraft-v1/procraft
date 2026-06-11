import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Request, Response } from 'express';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { NotFoundException } from '../common/exceptions';
import { getPublicOrigin } from '../common/request-context';
import { ProfileEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';
import { PdfService } from './pdf.service';

const FALLBACK_API_ORIGIN = 'https://api.procraft.uz';

/** Port of PdfController + GeneratePdfCommandHandler. */
@Controller('api/pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('download')
  async download(
    @ReqUser() current: CurrentUser,
    @Req() req: Request,
    @Res() res: Response,
    @Query('templateSlug') templateSlug?: string,
  ): Promise<void> {
    const profile = await this.dataSource
      .getRepository(ProfileEntity)
      .findOne({ where: { userId: current.userId }, relations: { user: true, template: true } });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const sections = await this.profileService.loadSections(profile.id);

    const content = await this.pdfService.generateResume({
      fullName: profile.fullName,
      title: profile.title,
      summary: profile.bio,
      location: profile.location,
      skills: sections.skills.map((skill) => ({
        name: skill.name,
        level: skill.level ?? null,
        category: skill.category ?? null,
      })),
      projects: sections.projects.map((project) => ({
        name: project.name,
        description: project.description,
        githubUrl: project.githubUrl,
        isRepositoryPrivate: project.isRepositoryPrivate,
        liveUrl: project.liveUrl,
      })),
      experiences: sections.workExperiences.map((experience) => ({
        company: experience.company,
        experienceType: experience.experienceType,
        position: experience.position,
        description: experience.description,
        startDate: experience.startDate,
        endDate: experience.endDate,
        isCurrent: experience.isCurrent,
      })),
      educations: sections.educations.map((education) => ({
        institution: education.institution,
        educationType: education.educationType,
        degree: education.degree,
        field: education.field,
        startDate: education.startDate,
        endDate: education.endDate,
      })),
      certificates: sections.certificates.map((certificate) => ({
        name: certificate.name,
        issuer: certificate.issuer,
        issuedOn: certificate.issuedOn,
        url: this.toPublicUrl(certificate.url, req),
      })),
      socialLinks: sections.socialLinks.map((link) => ({ platform: link.platform, url: link.url })),
      templateSlug: templateSlug ?? profile.template?.slug ?? null,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=resume.pdf; filename*=UTF-8''resume.pdf`);
    res.send(content);
  }

  private toPublicUrl(value: string | null, req: Request): string | null {
    if (!value || value.trim() === '') {
      return value;
    }

    const trimmed = value.trim();
    try {
      // Absolute URLs pass through unchanged.
      new URL(trimmed);
      return trimmed;
    } catch {
      // not absolute — fall through
    }

    if (!trimmed.toLowerCase().startsWith('/uploads/')) {
      return trimmed;
    }

    const publicOrigin = getPublicOrigin(req);
    const origin = publicOrigin && publicOrigin.trim() !== '' ? publicOrigin.replace(/\/+$/, '') : FALLBACK_API_ORIGIN;
    return `${origin}${trimmed}`;
  }
}
