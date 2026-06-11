import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * EF Core-compatible migration runner.
 *
 * The schema is owned by the same migration history the ASP.NET backend used
 * ("__EFMigrationsHistory" + identical MigrationIds and DDL). Consequences:
 *  - Existing production databases: every migration is already recorded, so
 *    startup is a strict no-op. No data is ever touched.
 *  - Fresh databases: the full schema is created exactly as EF would have.
 *  - Rollback to the ASP.NET image keeps working, because EF sees all of its
 *    migrations as applied.
 *
 * Never add destructive statements here. Never enable TypeORM synchronize.
 */

interface EfMigration {
  id: string;
  statements: string[];
}

const PRODUCT_VERSION = '8.0.13';

const MIGRATIONS: EfMigration[] = [
  {
    id: '20260504120000_CreateAuthTables',
    statements: [
      `CREATE TABLE users (
        "Id" uuid NOT NULL,
        "Email" character varying(320) NOT NULL,
        "Username" character varying(30) NOT NULL,
        "PasswordHash" character varying(512) NOT NULL,
        "IsEmailConfirmed" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_users" PRIMARY KEY ("Id"))`,
      `CREATE TABLE refresh_tokens (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TokenHash" character varying(64) NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "RevokedAt" timestamp with time zone,
        "ReplacedByTokenHash" character varying(64),
        "CreatedByIp" character varying(64),
        "RevokedByIp" character varying(64),
        "UserAgent" character varying(512),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_refresh_tokens_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE)`,
      `CREATE UNIQUE INDEX "IX_refresh_tokens_TokenHash" ON refresh_tokens ("TokenHash")`,
      `CREATE INDEX "IX_refresh_tokens_UserId" ON refresh_tokens ("UserId")`,
      `CREATE UNIQUE INDEX "IX_users_Email" ON users ("Email")`,
      `CREATE UNIQUE INDEX "IX_users_Username" ON users ("Username")`,
    ],
  },
  {
    id: '20260504123000_CreateProfilesTable',
    statements: [
      `CREATE TABLE profiles (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "FullName" character varying(160) NOT NULL,
        "Title" character varying(100),
        "Bio" character varying(1000),
        "Location" character varying(160),
        "Website" character varying(2048),
        "AvatarUrl" character varying(2048),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_profiles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_profiles_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE)`,
      `CREATE UNIQUE INDEX "IX_profiles_UserId" ON profiles ("UserId")`,
    ],
  },
  {
    id: '20260504124500_AddTemplatesAndProfileSelection',
    statements: [
      `CREATE TABLE templates (
        "Id" uuid NOT NULL,
        "Name" character varying(160) NOT NULL,
        "Slug" character varying(160) NOT NULL,
        "Description" character varying(1024),
        "PreviewUrl" character varying(2048),
        "IsActive" boolean NOT NULL,
        "IsPremium" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_templates" PRIMARY KEY ("Id"))`,
      `ALTER TABLE profiles ADD "TemplateId" uuid`,
      `CREATE UNIQUE INDEX "IX_templates_Slug" ON templates ("Slug")`,
      `INSERT INTO templates ("Id", "Name", "Slug", "Description", "PreviewUrl", "IsActive", "IsPremium", "CreatedAt", "UpdatedAt")
       VALUES
         ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d01', 'Minimal', 'minimal', 'Clean typography-forward layout.', NULL, TRUE, FALSE, TIMESTAMPTZ '2026-05-04 12:45:00+00', NULL),
         ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d02', 'Modern', 'modern', 'Card-based modern layout.', NULL, TRUE, FALSE, TIMESTAMPTZ '2026-05-04 12:45:00+00', NULL),
         ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d03', 'Classic', 'classic', 'Traditional chronological resume.', NULL, TRUE, FALSE, TIMESTAMPTZ '2026-05-04 12:45:00+00', NULL)
       ON CONFLICT ("Slug") DO NOTHING`,
      `CREATE INDEX "IX_profiles_TemplateId" ON profiles ("TemplateId")`,
      `ALTER TABLE profiles ADD CONSTRAINT "FK_profiles_templates_TemplateId" FOREIGN KEY ("TemplateId") REFERENCES templates ("Id") ON DELETE SET NULL`,
    ],
  },
  {
    id: '20260505120000_CreateProfileChildSectionTables',
    statements: [
      `CREATE TABLE skills (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "Level" smallint,
        "Category" character varying(50),
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_skills" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_skills_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE projects (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Description" character varying(1000),
        "GithubUrl" character varying(255),
        "LiveUrl" character varying(255),
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_projects" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_projects_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE work_experiences (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Company" character varying(200) NOT NULL,
        "Position" character varying(200) NOT NULL,
        "Description" character varying(1000),
        "StartDate" date NOT NULL,
        "EndDate" date,
        "IsCurrent" boolean NOT NULL,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_work_experiences" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_work_experiences_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE educations (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Institution" character varying(200) NOT NULL,
        "Degree" character varying(100),
        "Field" character varying(100),
        "StartDate" date,
        "EndDate" date,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_educations" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_educations_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE certificates (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Issuer" character varying(100),
        "IssuedOn" date,
        "Url" character varying(255),
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_certificates" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_certificates_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE social_links (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Platform" character varying(100) NOT NULL,
        "Url" character varying(255) NOT NULL,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_social_links" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_social_links_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE custom_sections (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Title" character varying(160) NOT NULL,
        "Content" character varying(8000) NOT NULL,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_custom_sections" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_custom_sections_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE INDEX "IX_skills_ProfileId" ON skills ("ProfileId")`,
      `CREATE INDEX "IX_skills_ProfileId_SortOrder" ON skills ("ProfileId", "SortOrder")`,
      `CREATE UNIQUE INDEX "IX_skills_ProfileId_Name" ON skills ("ProfileId", "Name")`,
      `CREATE INDEX "IX_projects_ProfileId" ON projects ("ProfileId")`,
      `CREATE INDEX "IX_projects_ProfileId_SortOrder" ON projects ("ProfileId", "SortOrder")`,
      `CREATE INDEX "IX_work_experiences_ProfileId" ON work_experiences ("ProfileId")`,
      `CREATE INDEX "IX_work_experiences_ProfileId_SortOrder" ON work_experiences ("ProfileId", "SortOrder")`,
      `CREATE INDEX "IX_educations_ProfileId" ON educations ("ProfileId")`,
      `CREATE INDEX "IX_educations_ProfileId_SortOrder" ON educations ("ProfileId", "SortOrder")`,
      `CREATE INDEX "IX_certificates_ProfileId" ON certificates ("ProfileId")`,
      `CREATE INDEX "IX_certificates_ProfileId_SortOrder" ON certificates ("ProfileId", "SortOrder")`,
      `CREATE INDEX "IX_social_links_ProfileId" ON social_links ("ProfileId")`,
      `CREATE INDEX "IX_social_links_ProfileId_SortOrder" ON social_links ("ProfileId", "SortOrder")`,
      `CREATE INDEX "IX_custom_sections_ProfileId" ON custom_sections ("ProfileId")`,
      `CREATE INDEX "IX_custom_sections_ProfileId_SortOrder" ON custom_sections ("ProfileId", "SortOrder")`,
    ],
  },
  {
    id: '20260506120000_CreateOperationalTables',
    statements: [
      `CREATE TABLE subscriptions (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PlanKey" character varying(120) NOT NULL,
        "Status" character varying(32) NOT NULL,
        "CurrentPeriodEnd" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_subscriptions_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE analytics_events (
        "Id" uuid NOT NULL,
        "ProfileId" uuid,
        "EventType" character varying(64) NOT NULL,
        "Path" character varying(2048),
        "Metadata" character varying(8000),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_analytics_events" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_analytics_events_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE SET NULL)`,
      `CREATE TABLE pdf_exports (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Status" character varying(64) NOT NULL,
        "StoragePath" character varying(1024),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_pdf_exports" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_pdf_exports_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE TABLE payment_requests (
        "Id" uuid NOT NULL,
        "SubscriptionId" uuid NOT NULL,
        "Type" character varying(32) NOT NULL,
        "Status" character varying(32) NOT NULL,
        "Amount" numeric(12,2) NOT NULL,
        "Currency" character varying(8) NOT NULL,
        "ExternalReference" character varying(200),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_payment_requests" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_payment_requests_subscriptions_SubscriptionId" FOREIGN KEY ("SubscriptionId") REFERENCES subscriptions ("Id") ON DELETE CASCADE)`,
      `CREATE INDEX "IX_subscriptions_UserId" ON subscriptions ("UserId")`,
      `CREATE INDEX "IX_analytics_events_ProfileId_CreatedAt" ON analytics_events ("ProfileId", "CreatedAt")`,
      `CREATE INDEX "IX_pdf_exports_ProfileId" ON pdf_exports ("ProfileId")`,
      `CREATE INDEX "IX_payment_requests_SubscriptionId" ON payment_requests ("SubscriptionId")`,
    ],
  },
  {
    id: '20260509120000_RemoveProfileWebsite',
    statements: [`ALTER TABLE profiles DROP COLUMN "Website"`],
  },
  {
    id: '20260509123000_CreateSkillCategories',
    statements: [
      `CREATE TABLE skill_categories (
        "Id" uuid NOT NULL,
        "ProfileId" uuid NOT NULL,
        "Name" character varying(80) NOT NULL,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_skill_categories" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_skill_categories_profiles_ProfileId" FOREIGN KEY ("ProfileId") REFERENCES profiles ("Id") ON DELETE CASCADE)`,
      `CREATE INDEX "IX_skill_categories_ProfileId" ON skill_categories ("ProfileId")`,
      `CREATE UNIQUE INDEX "IX_skill_categories_ProfileId_Name" ON skill_categories ("ProfileId", "Name")`,
      `CREATE INDEX "IX_skill_categories_ProfileId_SortOrder" ON skill_categories ("ProfileId", "SortOrder")`,
    ],
  },
  {
    id: '20260509124500_AddProjectRepositoryVisibility',
    statements: [`ALTER TABLE projects ADD "IsRepositoryPrivate" boolean NOT NULL DEFAULT FALSE`],
  },
  {
    id: '20260509130000_AddWorkExperienceType',
    statements: [
      `ALTER TABLE work_experiences ADD "ExperienceType" character varying(30) NOT NULL DEFAULT 'work'`,
    ],
  },
  {
    id: '20260509131500_AddEducationType',
    statements: [`ALTER TABLE educations ADD "EducationType" character varying(30) NOT NULL DEFAULT 'formal'`],
  },
  {
    id: '20260510120000_CreateLoginVerificationCodes',
    statements: [
      `CREATE TABLE login_verification_codes (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CodeHash" character varying(64) NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "ConsumedAt" timestamp with time zone,
        "AttemptCount" integer NOT NULL,
        "CreatedByIp" character varying(64),
        "UserAgent" character varying(512),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_login_verification_codes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_login_verification_codes_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE)`,
      `CREATE INDEX "IX_login_verification_codes_UserId" ON login_verification_codes ("UserId")`,
      `CREATE INDEX "IX_login_verification_codes_UserId_ExpiresAt" ON login_verification_codes ("UserId", "ExpiresAt")`,
    ],
  },
  {
    id: '20260510121000_CreatePasswordResetCodes',
    statements: [
      `CREATE TABLE password_reset_codes (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CodeHash" character varying(64) NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "ConsumedAt" timestamp with time zone,
        "AttemptCount" integer NOT NULL,
        "CreatedByIp" character varying(64),
        "UserAgent" character varying(512),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_password_reset_codes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_password_reset_codes_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE)`,
      `CREATE INDEX "IX_password_reset_codes_UserId" ON password_reset_codes ("UserId")`,
      `CREATE INDEX "IX_password_reset_codes_UserId_ExpiresAt" ON password_reset_codes ("UserId", "ExpiresAt")`,
    ],
  },
  {
    id: '20260510122000_AddEditorialTemplate',
    statements: [
      `INSERT INTO templates ("Id", "Name", "Slug", "Description", "PreviewUrl", "IsActive", "IsPremium", "CreatedAt", "UpdatedAt")
       VALUES ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d04', 'Editorial', 'editorial', 'Magazine-style editorial portfolio.', '/templates/editorial.svg', TRUE, FALSE, TIMESTAMPTZ '2026-05-10 12:20:00+00', NULL)
       ON CONFLICT ("Slug") DO UPDATE SET
         "Name" = EXCLUDED."Name",
         "Description" = EXCLUDED."Description",
         "PreviewUrl" = EXCLUDED."PreviewUrl",
         "IsActive" = TRUE,
         "UpdatedAt" = TIMESTAMPTZ '2026-05-10 12:20:00+00'`,
    ],
  },
  {
    id: '20260517120000_CreatePendingRegistrations',
    statements: [
      `CREATE TABLE pending_registrations (
        "Id" uuid NOT NULL,
        "Email" character varying(320) NOT NULL,
        "Username" character varying(30) NOT NULL,
        "PasswordHash" character varying(512) NOT NULL,
        "CodeHash" character varying(64) NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "ConsumedAt" timestamp with time zone,
        "AttemptCount" integer NOT NULL,
        "CreatedByIp" character varying(64),
        "UserAgent" character varying(512),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_pending_registrations" PRIMARY KEY ("Id"))`,
      `CREATE INDEX "IX_pending_registrations_Email" ON pending_registrations ("Email")`,
      `CREATE INDEX "IX_pending_registrations_ExpiresAt" ON pending_registrations ("ExpiresAt")`,
      `CREATE INDEX "IX_pending_registrations_Username" ON pending_registrations ("Username")`,
    ],
  },
  {
    id: '20260518120000_AddUserPhoneNumber',
    statements: [
      `ALTER TABLE users ADD "PhoneNumber" character varying(32)`,
      `ALTER TABLE pending_registrations ADD "PhoneNumber" character varying(32)`,
    ],
  },
  {
    id: '20260522110000_AddDeveloperTemplate',
    statements: [
      `INSERT INTO templates ("Id", "Name", "Slug", "Description", "PreviewUrl", "IsActive", "IsPremium", "CreatedAt", "UpdatedAt")
       VALUES ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d05', 'Developer', 'developer', 'Dark terminal and code editor portfolio for developers.', '/templates/developer.svg', TRUE, FALSE, TIMESTAMPTZ '2026-05-22 11:00:00+00', NULL)
       ON CONFLICT ("Slug") DO UPDATE SET
         "Name" = EXCLUDED."Name",
         "Description" = EXCLUDED."Description",
         "PreviewUrl" = EXCLUDED."PreviewUrl",
         "IsActive" = TRUE,
         "UpdatedAt" = TIMESTAMPTZ '2026-05-22 11:00:00+00'`,
    ],
  },
];

const MIGRATION_LOCK_KEY = 859435400;

export async function runEfCompatibleMigrations(dataSource: DataSource, logger: Logger): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.query(`SELECT pg_advisory_lock(${MIGRATION_LOCK_KEY})`);

    try {
      await queryRunner.query(
        `CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
          "MigrationId" character varying(150) NOT NULL,
          "ProductVersion" character varying(32) NOT NULL,
          CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId"))`,
      );

      const appliedRows: Array<{ MigrationId: string }> = await queryRunner.query(
        `SELECT "MigrationId" FROM "__EFMigrationsHistory"`,
      );
      const applied = new Set(appliedRows.map((row) => row.MigrationId));
      const pending = MIGRATIONS.filter((migration) => !applied.has(migration.id));

      logger.log(
        `EF-compatible migration check. Discovered=${MIGRATIONS.length}; Applied=${applied.size}; Pending=${pending.length}; PendingMigrations=${pending.map((m) => m.id).join(', ') || '(none)'}`,
      );

      for (const migration of pending) {
        await queryRunner.startTransaction();
        try {
          for (const statement of migration.statements) {
            await queryRunner.query(statement);
          }
          await queryRunner.query(
            `INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ($1, $2)`,
            [migration.id, PRODUCT_VERSION],
          );
          await queryRunner.commitTransaction();
          logger.log(`Applied migration ${migration.id}`);
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw new Error(`Migration ${migration.id} failed: ${(error as Error).message}`);
        }
      }

      logger.log('Database migrations applied successfully.');
    } finally {
      await queryRunner.query(`SELECT pg_advisory_unlock(${MIGRATION_LOCK_KEY})`);
    }
  } finally {
    await queryRunner.release();
  }
}
