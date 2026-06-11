import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

/**
 * Entities map 1:1 onto the schema created by the EF Core migrations:
 * snake_case table names, PascalCase column names. synchronize is always off —
 * the schema is owned by the EF-compatible migration runner.
 */

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('character varying', { name: 'Email', length: 320 })
  email: string;

  @Column('character varying', { name: 'Username', length: 30 })
  username: string;

  @Column('character varying', { name: 'PhoneNumber', length: 32, nullable: true })
  phoneNumber: string | null;

  @Column('character varying', { name: 'PasswordHash', length: 512 })
  passwordHash: string;

  @Column('boolean', { name: 'IsEmailConfirmed' })
  isEmailConfirmed: boolean;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('templates')
export class TemplateEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('character varying', { name: 'Name', length: 160 })
  name: string;

  @Column('character varying', { name: 'Slug', length: 160 })
  slug: string;

  @Column('character varying', { name: 'Description', length: 1024, nullable: true })
  description: string | null;

  @Column('character varying', { name: 'PreviewUrl', length: 2048, nullable: true })
  previewUrl: string | null;

  @Column('boolean', { name: 'IsActive' })
  isActive: boolean;

  @Column('boolean', { name: 'IsPremium' })
  isPremium: boolean;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('profiles')
export class ProfileEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'UserId' })
  userId: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'UserId' })
  user?: UserEntity;

  @Column('uuid', { name: 'TemplateId', nullable: true })
  templateId: string | null;

  @ManyToOne(() => TemplateEntity, { nullable: true })
  @JoinColumn({ name: 'TemplateId' })
  template?: TemplateEntity | null;

  @Column('character varying', { name: 'FullName', length: 160 })
  fullName: string;

  @Column('character varying', { name: 'Title', length: 100, nullable: true })
  title: string | null;

  @Column('character varying', { name: 'Bio', length: 1000, nullable: true })
  bio: string | null;

  @Column('character varying', { name: 'Location', length: 160, nullable: true })
  location: string | null;

  @Column('character varying', { name: 'AvatarUrl', length: 2048, nullable: true })
  avatarUrl: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'UserId' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'UserId' })
  user?: UserEntity;

  @Column('character varying', { name: 'TokenHash', length: 64 })
  tokenHash: string;

  @Column('timestamp with time zone', { name: 'ExpiresAt' })
  expiresAt: Date;

  @Column('timestamp with time zone', { name: 'RevokedAt', nullable: true })
  revokedAt: Date | null;

  @Column('character varying', { name: 'ReplacedByTokenHash', length: 64, nullable: true })
  replacedByTokenHash: string | null;

  @Column('character varying', { name: 'CreatedByIp', length: 64, nullable: true })
  createdByIp: string | null;

  @Column('character varying', { name: 'RevokedByIp', length: 64, nullable: true })
  revokedByIp: string | null;

  @Column('character varying', { name: 'UserAgent', length: 512, nullable: true })
  userAgent: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('login_verification_codes')
export class LoginVerificationCodeEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'UserId' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'UserId' })
  user?: UserEntity;

  @Column('character varying', { name: 'CodeHash', length: 64 })
  codeHash: string;

  @Column('timestamp with time zone', { name: 'ExpiresAt' })
  expiresAt: Date;

  @Column('timestamp with time zone', { name: 'ConsumedAt', nullable: true })
  consumedAt: Date | null;

  @Column('integer', { name: 'AttemptCount' })
  attemptCount: number;

  @Column('character varying', { name: 'CreatedByIp', length: 64, nullable: true })
  createdByIp: string | null;

  @Column('character varying', { name: 'UserAgent', length: 512, nullable: true })
  userAgent: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('password_reset_codes')
export class PasswordResetCodeEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'UserId' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'UserId' })
  user?: UserEntity;

  @Column('character varying', { name: 'CodeHash', length: 64 })
  codeHash: string;

  @Column('timestamp with time zone', { name: 'ExpiresAt' })
  expiresAt: Date;

  @Column('timestamp with time zone', { name: 'ConsumedAt', nullable: true })
  consumedAt: Date | null;

  @Column('integer', { name: 'AttemptCount' })
  attemptCount: number;

  @Column('character varying', { name: 'CreatedByIp', length: 64, nullable: true })
  createdByIp: string | null;

  @Column('character varying', { name: 'UserAgent', length: 512, nullable: true })
  userAgent: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('pending_registrations')
export class PendingRegistrationEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('character varying', { name: 'Email', length: 320 })
  email: string;

  @Column('character varying', { name: 'Username', length: 30 })
  username: string;

  @Column('character varying', { name: 'PhoneNumber', length: 32, nullable: true })
  phoneNumber: string | null;

  @Column('character varying', { name: 'PasswordHash', length: 512 })
  passwordHash: string;

  @Column('character varying', { name: 'CodeHash', length: 64 })
  codeHash: string;

  @Column('timestamp with time zone', { name: 'ExpiresAt' })
  expiresAt: Date;

  @Column('timestamp with time zone', { name: 'ConsumedAt', nullable: true })
  consumedAt: Date | null;

  @Column('integer', { name: 'AttemptCount' })
  attemptCount: number;

  @Column('character varying', { name: 'CreatedByIp', length: 64, nullable: true })
  createdByIp: string | null;

  @Column('character varying', { name: 'UserAgent', length: 512, nullable: true })
  userAgent: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('skills')
export class SkillEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Name', length: 120 })
  name: string;

  @Column('smallint', { name: 'Level', nullable: true })
  level: number | null;

  @Column('character varying', { name: 'Category', length: 50, nullable: true })
  category: string | null;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('skill_categories')
export class SkillCategoryEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Name', length: 80 })
  name: string;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('projects')
export class ProjectEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Name', length: 200 })
  name: string;

  @Column('character varying', { name: 'Description', length: 1000, nullable: true })
  description: string | null;

  @Column('character varying', { name: 'GithubUrl', length: 255, nullable: true })
  githubUrl: string | null;

  @Column('boolean', { name: 'IsRepositoryPrivate' })
  isRepositoryPrivate: boolean;

  @Column('character varying', { name: 'LiveUrl', length: 255, nullable: true })
  liveUrl: string | null;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('work_experiences')
export class WorkExperienceEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Company', length: 200 })
  company: string;

  @Column('character varying', { name: 'ExperienceType', length: 30 })
  experienceType: string;

  @Column('character varying', { name: 'Position', length: 200 })
  position: string;

  @Column('character varying', { name: 'Description', length: 1000, nullable: true })
  description: string | null;

  @Column('date', { name: 'StartDate' })
  startDate: string;

  @Column('date', { name: 'EndDate', nullable: true })
  endDate: string | null;

  @Column('boolean', { name: 'IsCurrent' })
  isCurrent: boolean;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('educations')
export class EducationEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Institution', length: 200 })
  institution: string;

  @Column('character varying', { name: 'EducationType', length: 30 })
  educationType: string;

  @Column('character varying', { name: 'Degree', length: 100, nullable: true })
  degree: string | null;

  @Column('character varying', { name: 'Field', length: 100, nullable: true })
  field: string | null;

  @Column('date', { name: 'StartDate', nullable: true })
  startDate: string | null;

  @Column('date', { name: 'EndDate', nullable: true })
  endDate: string | null;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('certificates')
export class CertificateEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Name', length: 200 })
  name: string;

  @Column('character varying', { name: 'Issuer', length: 100, nullable: true })
  issuer: string | null;

  @Column('date', { name: 'IssuedOn', nullable: true })
  issuedOn: string | null;

  @Column('character varying', { name: 'Url', length: 255, nullable: true })
  url: string | null;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('social_links')
export class SocialLinkEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Platform', length: 100 })
  platform: string;

  @Column('character varying', { name: 'Url', length: 255 })
  url: string;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('custom_sections')
export class CustomSectionEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Title', length: 160 })
  title: string;

  @Column('character varying', { name: 'Content', length: 8000 })
  content: string;

  @Column('integer', { name: 'SortOrder' })
  sortOrder: number;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('analytics_events')
export class AnalyticsEventEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId', nullable: true })
  profileId: string | null;

  /** Stored as string via EF HasConversion<string>(): 'PageView' | 'Download' | 'ContactReveal'. */
  @Column('character varying', { name: 'EventType', length: 64 })
  eventType: string;

  @Column('character varying', { name: 'Path', length: 2048, nullable: true })
  path: string | null;

  @Column('character varying', { name: 'Metadata', length: 8000, nullable: true })
  metadata: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'UserId' })
  userId: string;

  @Column('character varying', { name: 'PlanKey', length: 120 })
  planKey: string;

  /** Stored as string via EF HasConversion<string>(): 'None' | 'Trial' | 'Active' | 'PastDue' | 'Canceled'. */
  @Column('character varying', { name: 'Status', length: 32 })
  status: string;

  @Column('timestamp with time zone', { name: 'CurrentPeriodEnd', nullable: true })
  currentPeriodEnd: Date | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('payment_requests')
export class PaymentRequestEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'SubscriptionId' })
  subscriptionId: string;

  @Column('character varying', { name: 'Type', length: 32 })
  type: string;

  @Column('character varying', { name: 'Status', length: 32 })
  status: string;

  @Column('numeric', { name: 'Amount', precision: 12, scale: 2 })
  amount: string;

  @Column('character varying', { name: 'Currency', length: 8 })
  currency: string;

  @Column('character varying', { name: 'ExternalReference', length: 200, nullable: true })
  externalReference: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

@Entity('pdf_exports')
export class PdfExportEntity {
  @PrimaryColumn('uuid', { name: 'Id' })
  id: string;

  @Column('uuid', { name: 'ProfileId' })
  profileId: string;

  @Column('character varying', { name: 'Status', length: 64 })
  status: string;

  @Column('character varying', { name: 'StoragePath', length: 1024, nullable: true })
  storagePath: string | null;

  @Column('timestamp with time zone', { name: 'CreatedAt' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'UpdatedAt', nullable: true })
  updatedAt: Date | null;
}

export const ALL_ENTITIES = [
  UserEntity,
  TemplateEntity,
  ProfileEntity,
  RefreshTokenEntity,
  LoginVerificationCodeEntity,
  PasswordResetCodeEntity,
  PendingRegistrationEntity,
  SkillEntity,
  SkillCategoryEntity,
  ProjectEntity,
  WorkExperienceEntity,
  EducationEntity,
  CertificateEntity,
  SocialLinkEntity,
  CustomSectionEntity,
  AnalyticsEventEntity,
  SubscriptionEntity,
  PaymentRequestEntity,
  PdfExportEntity,
];
