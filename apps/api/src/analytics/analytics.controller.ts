import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { getClientIp, getUserAgent } from '../common/request-context';
import { Validator, isUuid } from '../common/validation';
import { AnalyticsEventEntity, ProfileEntity } from '../database/entities';

interface TrackBody {
  profileId?: string;
  referer?: string | null;
}

interface AnalyticsMetadata {
  Ip: string | null;
  UserAgent: string | null;
  Referer: string | null;
  Country: string;
  City: string;
}

/** Port of AnalyticsController + Track/Summary handlers. */
@Controller('api/analytics')
export class AnalyticsController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Post('track')
  @HttpCode(200)
  async track(@Req() req: Request, @Body() body: TrackBody) {
    // No FluentValidation on the C# command: a missing ProfileId binds to
    // Guid.Empty and falls through to the 404 lookup; malformed values fail binding.
    if (body.profileId !== undefined && body.profileId !== null && !isUuid(body.profileId)) {
      const validator = new Validator();
      validator.ruleFor('ProfileId', body.profileId).guid();
      validator.throwIfInvalid();
    }

    const profileId =
      typeof body.profileId === 'string' && isUuid(body.profileId)
        ? body.profileId.toLowerCase()
        : '00000000-0000-0000-0000-000000000000';

    const profileExists = await this.dataSource.getRepository(ProfileEntity).exists({ where: { id: profileId } });

    if (!profileExists) {
      throw new NotFoundException('Profile not found.');
    }

    const now = new Date();
    const referer = typeof body.referer === 'string' ? body.referer : null;

    const metadata: AnalyticsMetadata = {
      Ip: getClientIp(req),
      UserAgent: getUserAgent(req),
      Referer: referer,
      Country: 'UZ',
      City: 'Tashkent',
    };

    const item: AnalyticsEventEntity = {
      id: randomUUID(),
      profileId,
      eventType: 'PageView',
      path: referer,
      metadata: JSON.stringify(metadata),
      createdAt: now,
      updatedAt: null,
    };

    await this.dataSource.getRepository(AnalyticsEventEntity).insert(item);

    return {
      id: item.id,
      profileId: item.profileId,
      eventType: item.eventType,
      path: item.path,
      createdAt: toDateTimeOffsetString(item.createdAt),
    };
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async summary(@ReqUser() current: CurrentUser) {
    const profile = await this.dataSource
      .getRepository(ProfileEntity)
      .findOne({ where: { userId: current.userId }, select: { id: true } });

    if (!profile) {
      return {
        totalViews: 0,
        last30DaysViews: 0,
        topCountries: [],
        viewsByDate: [],
        recentVisitors: [],
      };
    }

    const events = await this.dataSource.getRepository(AnalyticsEventEntity).find({
      where: { profileId: profile.id },
      order: { createdAt: 'DESC' },
    });

    const nowMs = Date.now();
    const cutoff = new Date(nowMs - 30 * 86_400_000);
    const last30 = events.filter((event) => event.createdAt >= cutoff);
    const metadata = events.map(readMetadata);

    const countryCounts = new Map<string, number>();
    for (const item of metadata) {
      if (item.Country && item.Country.trim() !== '') {
        countryCounts.set(item.Country, (countryCounts.get(item.Country) ?? 0) + 1);
      }
    }

    const topCountries = [...countryCounts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dateCounts = new Map<string, number>();
    for (const event of last30) {
      const date = event.createdAt.toISOString().slice(0, 10);
      dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1);
    }

    const viewsByDate = [...dateCounts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    const recentVisitors = events.slice(0, 10).map((event) => {
      const item = readMetadata(event);
      const minutes = Math.max(1, Math.trunc((nowMs - event.createdAt.getTime()) / 60_000));
      return { city: item.City, country: item.Country, time: `${minutes} minutes ago` };
    });

    return {
      totalViews: events.length,
      last30DaysViews: last30.length,
      topCountries,
      viewsByDate,
      recentVisitors,
    };
  }
}

function readMetadata(event: AnalyticsEventEntity): AnalyticsMetadata {
  const fallback: AnalyticsMetadata = {
    Ip: null,
    UserAgent: null,
    Referer: null,
    Country: 'Unknown',
    City: 'Unknown',
  };

  if (!event.metadata || event.metadata.trim() === '') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(event.metadata) as Partial<AnalyticsMetadata>;
    return {
      Ip: parsed.Ip ?? null,
      UserAgent: parsed.UserAgent ?? null,
      Referer: parsed.Referer ?? null,
      Country: parsed.Country ?? 'Unknown',
      City: parsed.City ?? 'Unknown',
    };
  } catch {
    return fallback;
  }
}
