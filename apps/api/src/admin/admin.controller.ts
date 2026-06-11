import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createHash, timingSafeEqual } from 'crypto';
import { CookieOptions, Request, Response } from 'express';
import { toDateTimeOffsetString } from '../common/dates';
import { getConfig } from '../config/env';
import {
  AnalyticsEventEntity,
  ProfileEntity,
  TemplateEntity,
  UserEntity,
} from '../database/entities';

const ADMIN_COOKIE_NAME = 'procraft_admin_session';

interface AdminLoginBody {
  username?: string;
  password?: string;
}

interface AdminCredentials {
  username: string;
  password: string;
  secret: string;
}

function readCredentials(): AdminCredentials {
  const admin = getConfig().admin;
  return {
    username: admin.username,
    password: admin.password,
    secret: admin.sessionSecret,
  };
}

function isConfigured(credentials: AdminCredentials): boolean {
  return (
    credentials.username.trim() !== '' && credentials.password.trim() !== '' && credentials.secret.trim() !== ''
  );
}

function buildSessionToken(credentials: AdminCredentials): string {
  const value = `${credentials.username}:${credentials.password}:${credentials.secret}`;
  return createHash('sha256').update(value, 'utf8').digest('hex').toUpperCase();
}

function fixedEquals(left: string | undefined | null, right: string | undefined | null): boolean {
  const leftBytes = Buffer.from(left ?? '', 'utf8');
  const rightBytes = Buffer.from(right ?? '', 'utf8');
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function buildCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: getConfig().isProduction,
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + 12 * 3_600_000),
  };
}

/** Port of AdminController: static-credential session cookie + stats aggregate. */
@Controller('api/admin')
export class AdminController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Post('login')
  @HttpCode(200)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: AdminLoginBody) {
    const credentials = readCredentials();

    if (
      !isConfigured(credentials) ||
      !fixedEquals(typeof body.username === 'string' ? body.username : '', credentials.username) ||
      !fixedEquals(typeof body.password === 'string' ? body.password : '', credentials.password)
    ) {
      res.status(401);
      return { message: 'Invalid admin credentials' };
    }

    res.cookie(ADMIN_COOKIE_NAME, buildSessionToken(credentials), buildCookieOptions());
    return { authenticated: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ADMIN_COOKIE_NAME, buildCookieOptions());
    return { message: 'Logged out' };
  }

  @Get('me')
  me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!this.isAdminAuthenticated(req)) {
      res.status(401);
      return { message: 'Admin session expired' };
    }

    return { authenticated: true };
  }

  @Get('stats')
  async stats(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!this.isAdminAuthenticated(req)) {
      res.status(401);
      return { message: 'Admin session expired' };
    }

    const users = this.dataSource.getRepository(UserEntity);
    const profiles = this.dataSource.getRepository(ProfileEntity);
    const analytics = this.dataSource.getRepository(AnalyticsEventEntity);
    const templates = this.dataSource.getRepository(TemplateEntity);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

    const [totalUsers, totalProfiles] = await Promise.all([users.count(), profiles.count()]);

    const usersToday = await users
      .createQueryBuilder('u')
      .where('u."CreatedAt" >= :today', { today })
      .getCount();

    const profilesToday = await profiles
      .createQueryBuilder('p')
      .where('p."CreatedAt" >= :today', { today })
      .getCount();

    const totalProfileViews = await analytics
      .createQueryBuilder('a')
      .where(`a."EventType" = 'PageView'`)
      .getCount();

    const profileViewsLast7Days = await analytics
      .createQueryBuilder('a')
      .where(`a."EventType" = 'PageView' AND a."CreatedAt" >= :since`, { since: sevenDaysAgo })
      .getCount();

    const profilesWithoutTemplate = await profiles
      .createQueryBuilder('p')
      .where('p."TemplateId" IS NULL')
      .getCount();

    const templateUsageRows: Array<{ templateId: string; name: string; slug: string; users: string }> =
      await templates
        .createQueryBuilder('t')
        .leftJoin(ProfileEntity, 'p', 'p."TemplateId" = t."Id"')
        .select('t."Id"', 'templateId')
        .addSelect('t."Name"', 'name')
        .addSelect('t."Slug"', 'slug')
        .addSelect('COUNT(p."Id")', 'users')
        .groupBy('t."Id"')
        .addGroupBy('t."Name"')
        .addGroupBy('t."Slug"')
        .orderBy('t."Name"', 'ASC')
        .getRawMany();

    const templateUsage = templateUsageRows.map((row) => ({
      templateId: row.templateId,
      name: row.name,
      slug: row.slug,
      users: Number(row.users),
    }));

    const topProfileRows: Array<{ profileId: string; fullName: string; username: string; views: string }> =
      await analytics
        .createQueryBuilder('a')
        .innerJoin(ProfileEntity, 'p', 'p."Id" = a."ProfileId"')
        .innerJoin(UserEntity, 'u', 'u."Id" = p."UserId"')
        .where(`a."EventType" = 'PageView' AND a."ProfileId" IS NOT NULL`)
        .select('p."Id"', 'profileId')
        .addSelect('p."FullName"', 'fullName')
        .addSelect('u."Username"', 'username')
        .addSelect('COUNT(a."Id")', 'views')
        .groupBy('p."Id"')
        .addGroupBy('p."FullName"')
        .addGroupBy('u."Username"')
        .orderBy('views', 'DESC')
        .limit(5)
        .getRawMany();

    const topProfiles = topProfileRows.map((row) => ({
      profileId: row.profileId,
      fullName: row.fullName,
      username: row.username,
      views: Number(row.views),
    }));

    const creatorRows: Array<Record<string, unknown>> = await profiles
      .createQueryBuilder('p')
      .innerJoin(UserEntity, 'u', 'u."Id" = p."UserId"')
      .leftJoin(TemplateEntity, 't', 't."Id" = p."TemplateId"')
      .select('p."Id"', 'profileId')
      .addSelect('p."UserId"', 'userId')
      .addSelect('u."Email"', 'email')
      .addSelect('u."Username"', 'username')
      .addSelect('u."IsEmailConfirmed"', 'isEmailConfirmed')
      .addSelect('p."FullName"', 'fullName')
      .addSelect('p."Title"', 'title')
      .addSelect('t."Name"', 'templateName')
      .addSelect('t."Slug"', 'templateSlug')
      .addSelect('p."CreatedAt"', 'createdAt')
      .addSelect('p."UpdatedAt"', 'updatedAt')
      .addSelect('(SELECT COUNT(*) FROM skills s WHERE s."ProfileId" = p."Id")', 'skillsCount')
      .addSelect('(SELECT COUNT(*) FROM projects pr WHERE pr."ProfileId" = p."Id")', 'projectsCount')
      .addSelect('(SELECT COUNT(*) FROM work_experiences w WHERE w."ProfileId" = p."Id")', 'experiencesCount')
      .addSelect(
        `(SELECT COUNT(*) FROM analytics_events a WHERE a."ProfileId" = p."Id" AND a."EventType" = 'PageView')`,
        'views',
      )
      .orderBy('COALESCE(p."UpdatedAt", p."CreatedAt")', 'DESC')
      .getRawMany();

    const portfolioCreators = creatorRows.map((row) => ({
      profileId: row.profileId as string,
      userId: row.userId as string,
      email: row.email as string,
      username: row.username as string,
      isEmailConfirmed: row.isEmailConfirmed as boolean,
      fullName: row.fullName as string,
      title: (row.title as string | null) ?? null,
      templateName: (row.templateName as string | null) ?? null,
      templateSlug: (row.templateSlug as string | null) ?? null,
      createdAt: toDateTimeOffsetString(row.createdAt as Date),
      updatedAt: toDateTimeOffsetString(row.updatedAt as Date | null),
      skillsCount: Number(row.skillsCount),
      projectsCount: Number(row.projectsCount),
      experiencesCount: Number(row.experiencesCount),
      views: Number(row.views),
    }));

    return {
      totalUsers,
      totalProfiles,
      usersToday,
      profilesToday,
      totalProfileViews,
      profileViewsLast7Days,
      profilesWithoutTemplate,
      templateUsage,
      topProfiles,
      portfolioCreators,
    };
  }

  private isAdminAuthenticated(req: Request): boolean {
    const presented = (req.cookies ?? {})[ADMIN_COOKIE_NAME];
    if (!presented || typeof presented !== 'string' || presented.trim() === '') {
      return false;
    }

    const credentials = readCredentials();
    return isConfigured(credentials) && fixedEquals(presented, buildSessionToken(credentials));
  }
}
