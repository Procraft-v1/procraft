import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { CustomSectionEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';

interface CustomSectionBody {
  title?: string;
  content?: string;
  sortOrder?: number | null;
}

function toDto(item: CustomSectionEntity) {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function validateBody(body: CustomSectionBody): void {
  const validator = new Validator();
  validator.ruleFor('Title', typeof body.title === 'string' ? body.title : null).notEmpty().maximumLength(160);
  validator.ruleFor('Content', typeof body.content === 'string' ? body.content : null).notEmpty().maximumLength(8000);
  validator.throwIfInvalid();
}

@Controller('api/profile/custom-sections')
@UseGuards(JwtAuthGuard)
export class CustomSectionsController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(CustomSectionEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', title: 'ASC' },
    });
    return items.map(toDto);
  }

  @Post()
  @HttpCode(200)
  async create(@ReqUser() current: CurrentUser, @Body() body: CustomSectionBody) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);

    const item: CustomSectionEntity = {
      id: randomUUID(),
      profileId,
      title: body.title!.trim(),
      content: body.content!.trim(),
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.dataSource.getRepository(CustomSectionEntity).insert(item);
    return toDto(item);
  }

  @Put(':id')
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: CustomSectionBody,
  ) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(CustomSectionEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Custom section not found.');
    }

    item.title = body.title!.trim();
    item.content = body.content!.trim();
    item.sortOrder = body.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      { title: item.title, content: item.content, sortOrder: item.sortOrder, updatedAt: item.updatedAt },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(CustomSectionEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Custom section not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
