import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { SocialLinkEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';

interface SocialLinkBody {
  platform?: string;
  url?: string;
  sortOrder?: number | null;
}

function toDto(item: SocialLinkEntity) {
  return {
    id: item.id,
    platform: item.platform,
    url: item.url,
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function validateBody(body: SocialLinkBody): void {
  const validator = new Validator();
  validator.ruleFor('Platform', typeof body.platform === 'string' ? body.platform : null).notEmpty().maximumLength(100);
  validator.ruleFor('Url', typeof body.url === 'string' ? body.url : null).notEmpty().maximumLength(255);
  validator.throwIfInvalid();
}

@Controller('api/profile/social-links')
@UseGuards(JwtAuthGuard)
export class SocialLinksController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(SocialLinkEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', platform: 'ASC' },
    });
    return items.map(toDto);
  }

  @Post()
  @HttpCode(200)
  async create(@ReqUser() current: CurrentUser, @Body() body: SocialLinkBody) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);

    const item: SocialLinkEntity = {
      id: randomUUID(),
      profileId,
      platform: body.platform!.trim(),
      url: body.url!.trim(),
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.dataSource.getRepository(SocialLinkEntity).insert(item);
    return toDto(item);
  }

  @Put(':id')
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: SocialLinkBody,
  ) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(SocialLinkEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Social link not found.');
    }

    item.platform = body.platform!.trim();
    item.url = body.url!.trim();
    item.sortOrder = body.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      { platform: item.platform, url: item.url, sortOrder: item.sortOrder, updatedAt: item.updatedAt },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(SocialLinkEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Social link not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
