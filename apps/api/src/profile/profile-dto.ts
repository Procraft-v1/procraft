import { toDateOnlyString, toDateTimeOffsetString } from '../common/dates';
import {
  CertificateEntity,
  EducationEntity,
  ProfileEntity,
  ProjectEntity,
  SkillEntity,
  SocialLinkEntity,
  TemplateEntity,
  UserEntity,
  WorkExperienceEntity,
} from '../database/entities';

export interface ProfileSections {
  skills: SkillEntity[];
  projects: ProjectEntity[];
  workExperiences: WorkExperienceEntity[];
  educations: EducationEntity[];
  certificates: CertificateEntity[];
  socialLinks: SocialLinkEntity[];
}

export const EMPTY_SECTIONS: ProfileSections = {
  skills: [],
  projects: [],
  workExperiences: [],
  educations: [],
  certificates: [],
  socialLinks: [],
};

/**
 * Port of Procraft.Application.Profiles.DTOs.ProfileDto.FromProfile. Mutation
 * endpoints intentionally return empty section arrays — matching the C#
 * handlers, which did not Include child collections on writes.
 */
export function toProfileDto(
  profile: ProfileEntity,
  user: UserEntity,
  template: TemplateEntity | null,
  sections: ProfileSections = EMPTY_SECTIONS,
) {
  return {
    id: profile.id,
    userId: profile.userId,
    templateId: profile.templateId ?? null,
    username: user.username,
    fullName: profile.fullName,
    title: profile.title ?? null,
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    templateSlug: template?.slug ?? 'minimal',
    createdAt: toDateTimeOffsetString(profile.createdAt),
    updatedAt: toDateTimeOffsetString(profile.updatedAt),
    skills: sections.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      level: skill.level ?? null,
      category: skill.category ?? null,
    })),
    projects: sections.projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      githubUrl: project.githubUrl ?? null,
      isRepositoryPrivate: project.isRepositoryPrivate,
      liveUrl: project.liveUrl ?? null,
    })),
    workExperiences: sections.workExperiences.map((experience) => ({
      id: experience.id,
      company: experience.company,
      experienceType: experience.experienceType,
      position: experience.position,
      description: experience.description ?? null,
      startDate: toDateOnlyString(experience.startDate),
      endDate: toDateOnlyString(experience.endDate),
      isCurrent: experience.isCurrent,
    })),
    educations: sections.educations.map((education) => ({
      id: education.id,
      institution: education.institution,
      educationType: education.educationType,
      degree: education.degree ?? null,
      field: education.field ?? null,
      startDate: toDateOnlyString(education.startDate),
      endDate: toDateOnlyString(education.endDate),
    })),
    certificates: sections.certificates.map((certificate) => ({
      id: certificate.id,
      name: certificate.name,
      issuer: certificate.issuer ?? null,
      issuedOn: toDateOnlyString(certificate.issuedOn),
      url: certificate.url ?? null,
    })),
    socialLinks: sections.socialLinks.map((link) => ({
      id: link.id,
      platform: link.platform,
      url: link.url,
    })),
  };
}
