import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { SkillCategoryEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';

interface SkillCategoryBody {
  name?: string;
  sortOrder?: number | null;
}

function toDto(item: SkillCategoryEntity) {
  return {
    id: item.id,
    name: item.name,
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function validateBody(body: SkillCategoryBody): void {
  const validator = new Validator();
  validator.ruleFor('Name', typeof body.name === 'string' ? body.name : null).notEmpty().maximumLength(80);
  validator.throwIfInvalid();
}

@Controller('api/profile/skill-categories')
@UseGuards(JwtAuthGuard)
export class SkillCategoriesController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(SkillCategoryEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return items.map(toDto);
  }

  /** Idempotent on (profileId, name) — mirrors CreateSkillCategoryCommandHandler. */
  @Post()
  @HttpCode(200)
  async create(@ReqUser() current: CurrentUser, @Body() body: SkillCategoryBody) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(SkillCategoryEntity);

    const name = body.name!.trim();
    const existing = await repository.findOne({ where: { profileId, name } });
    if (existing) {
      return toDto(existing);
    }

    const item: SkillCategoryEntity = {
      id: randomUUID(),
      profileId,
      name,
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await repository.insert(item);
    return toDto(item);
  }

  @Put(':id')
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: SkillCategoryBody,
  ) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(SkillCategoryEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Skill category not found.');
    }

    item.name = body.name!.trim();
    item.sortOrder = body.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      { name: item.name, sortOrder: item.sortOrder, updatedAt: item.updatedAt },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(SkillCategoryEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Skill category not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
