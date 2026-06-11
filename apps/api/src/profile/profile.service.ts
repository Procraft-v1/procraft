import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { ConflictException, NotFoundException, UnauthorizedException } from '../common/exceptions';
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
import { CurrentUser } from '../auth/jwt-auth.guard';
import { FileStorageService } from '../storage/file-storage.service';
import { ProfileSections, toProfileDto } from './profile-dto';

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return !trimmed || trimmed === '' ? null : trimmed;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly fileStorage: FileStorageService,
  ) {}

  /** Shared with section services: profile id of the current user or NotFound. */
  async getCurrentProfileId(current: CurrentUser): Promise<string> {
    const profile = await this.dataSource
      .getRepository(ProfileEntity)
      .findOne({ where: { userId: current.userId }, select: { id: true } });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    return profile.id;
  }

  async getMyProfile(current: CurrentUser) {
    const profile = await this.dataSource
      .getRepository(ProfileEntity)
      .findOne({ where: { userId: current.userId }, relations: { user: true, template: true } });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const sections = await this.loadSections(profile.id);
    return toProfileDto(profile, profile.user!, profile.template ?? null, sections);
  }

  async getPublicProfile(username: string) {
    const normalizedUsername = username.trim().toLowerCase();

    const profile = await this.dataSource
      .getRepository(ProfileEntity)
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.template', 'template')
      .where('user."Username" = :username', { username: normalizedUsername })
      .getOne();

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const sections = await this.loadSections(profile.id);
    return toProfileDto(profile, profile.user!, profile.template ?? null, sections);
  }

  async createProfile(
    current: CurrentUser,
    fullName: string,
    title: string | null,
    bio: string | null,
    location: string | null,
    avatarUrl: string | null,
  ) {
    const users = this.dataSource.getRepository(UserEntity);
    const user = await users.findOne({ where: { id: current.userId } });

    if (!user) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const profiles = this.dataSource.getRepository(ProfileEntity);
    if (await profiles.exists({ where: { userId: user.id } })) {
      throw new ConflictException({ profile: ['Profile already exists.'] });
    }

    const now = new Date();
    const profile: ProfileEntity = {
      id: randomUUID(),
      userId: user.id,
      templateId: null,
      fullName: fullName.trim(),
      title: normalize(title),
      bio: normalize(bio),
      location: normalize(location),
      avatarUrl: normalize(avatarUrl),
      createdAt: now,
      updatedAt: null,
    };

    await profiles.insert(profile);
    return toProfileDto(profile, user, null);
  }

  async updateProfile(
    current: CurrentUser,
    fullName: string,
    title: string | null,
    bio: string | null,
    location: string | null,
    avatarUrl: string | null,
  ) {
    const profile = await this.requireOwnedProfile(current);

    profile.fullName = fullName.trim();
    profile.title = normalize(title);
    profile.bio = normalize(bio);
    profile.location = normalize(location);
    profile.avatarUrl = normalize(avatarUrl) ?? profile.avatarUrl;
    profile.updatedAt = new Date();

    await this.persistProfile(profile);
    return toProfileDto(profile, profile.user!, profile.template ?? null);
  }

  async selectTemplate(current: CurrentUser, templateId: string) {
    const template = await this.dataSource
      .getRepository(TemplateEntity)
      .findOne({ where: { id: templateId, isActive: true } });

    if (!template) {
      throw new NotFoundException('Template not found.');
    }

    const profile = await this.requireOwnedProfile(current);

    profile.templateId = template.id;
    profile.template = template;
    profile.updatedAt = new Date();

    await this.persistProfile(profile);
    return toProfileDto(profile, profile.user!, template);
  }

  async uploadAvatar(current: CurrentUser, buffer: Buffer, fileName: string, contentType: string) {
    const profile = await this.requireOwnedProfile(current);

    const previousAvatarUrl = profile.avatarUrl;
    const avatarUrl = await this.fileStorage.save(buffer, fileName, contentType, 'avatars');

    profile.avatarUrl = avatarUrl;
    profile.updatedAt = new Date();
    await this.persistProfile(profile);

    if (previousAvatarUrl && previousAvatarUrl.trim() !== '') {
      await this.fileStorage.delete(previousAvatarUrl);
    }

    return toProfileDto(profile, profile.user!, profile.template ?? null);
  }

  async deleteAvatar(current: CurrentUser) {
    const profile = await this.requireOwnedProfile(current);

    const avatarUrl = profile.avatarUrl;
    profile.avatarUrl = null;
    profile.updatedAt = new Date();
    await this.persistProfile(profile);

    if (avatarUrl && avatarUrl.trim() !== '') {
      await this.fileStorage.delete(avatarUrl);
    }

    return toProfileDto(profile, profile.user!, profile.template ?? null);
  }

  private async requireOwnedProfile(current: CurrentUser): Promise<ProfileEntity> {
    const profile = await this.dataSource
      .getRepository(ProfileEntity)
      .findOne({ where: { userId: current.userId }, relations: { user: true, template: true } });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    return profile;
  }

  private async persistProfile(profile: ProfileEntity): Promise<void> {
    await this.dataSource.getRepository(ProfileEntity).update(
      { id: profile.id },
      {
        templateId: profile.templateId,
        fullName: profile.fullName,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        avatarUrl: profile.avatarUrl,
        updatedAt: profile.updatedAt,
      },
    );
  }

  /** Section ordering matches the EF Includes on GetMyProfile/GetPublicProfile. */
  async loadSections(profileId: string, manager?: EntityManager): Promise<ProfileSections> {
    const em = manager ?? this.dataSource.manager;

    const [skills, projects, workExperiences, educations, certificates, socialLinks] = await Promise.all([
      em.getRepository(SkillEntity).find({
        where: { profileId },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      em.getRepository(ProjectEntity).find({
        where: { profileId },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      em.getRepository(WorkExperienceEntity).find({
        where: { profileId },
        order: { sortOrder: 'ASC', startDate: 'DESC' },
      }),
      em.getRepository(EducationEntity).find({
        where: { profileId },
        order: { sortOrder: 'ASC', startDate: 'DESC' },
      }),
      em.getRepository(CertificateEntity).find({
        where: { profileId },
        order: { sortOrder: 'ASC', issuedOn: 'DESC' },
      }),
      em.getRepository(SocialLinkEntity).find({
        where: { profileId },
        order: { sortOrder: 'ASC', platform: 'ASC' },
      }),
    ]);

    return { skills, projects, workExperiences, educations, certificates, socialLinks };
  }
}
