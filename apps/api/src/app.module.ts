import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConfig } from './config/env';
import { ALL_ENTITIES } from './database/entities';
import { AdminController } from './admin/admin.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CookieService } from './auth/cookie.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PasswordHasher } from './auth/password-hasher';
import { TokenService } from './auth/token.service';
import { GuidRouteParam } from './common/guid-param.pipe';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { HealthController } from './health/health.controller';
import { PdfController } from './pdf/pdf.controller';
import { PdfService } from './pdf/pdf.service';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { CertificatesController } from './sections/certificates';
import { CustomSectionsController } from './sections/custom-sections';
import { EducationsController } from './sections/educations';
import { ExperiencesController } from './sections/experiences';
import { ProjectsController } from './sections/projects';
import { SkillCategoriesController } from './sections/skill-categories';
import { SkillsController } from './sections/skills';
import { SocialLinksController } from './sections/social-links';
import { StorageModuleServices } from './storage/storage.providers';
import { SubscriptionsController } from './subscriptions/subscriptions.controller';
import { TelegramBotService } from './telegram/telegram.service';
import { TelegramController } from './telegram/telegram.controller';
import { TemplatesController } from './templates/templates.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = getConfig();
        const database = config.database;

        return {
          type: 'postgres' as const,
          host: database.host,
          port: database.port,
          username: database.username,
          password: database.password,
          database: database.database,
          entities: ALL_ENTITIES,
          // The schema is owned by the EF-compatible migration runner; TypeORM
          // must never mutate it.
          synchronize: false,
          migrationsRun: false,
          logging: false,
        };
      },
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    TelegramController,
    AdminController,
    AnalyticsController,
    TemplatesController,
    SubscriptionsController,
    PdfController,
    // Section controllers must register before ProfileController so their
    // literal segments win over the public-profile :username catch-all.
    SkillsController,
    SkillCategoriesController,
    ProjectsController,
    ExperiencesController,
    EducationsController,
    CertificatesController,
    SocialLinksController,
    CustomSectionsController,
    ProfileController,
  ],
  providers: [
    AuthService,
    CookieService,
    EmailService,
    SmsService,
    GuidRouteParam,
    JwtAuthGuard,
    PasswordHasher,
    PdfService,
    ProfileService,
    TelegramBotService,
    TokenService,
    ...StorageModuleServices,
  ],
})
export class AppModule {}
