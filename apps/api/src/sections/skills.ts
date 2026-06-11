import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { SkillEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';

interface SkillBody {
  name?: string;
  level?: number | null;
  category?: string | null;
  sortOrder?: number | null;
}

function toDto(item: SkillEntity) {
  return {
    id: item.id,
    name: item.name,
    level: item.level ?? null,
    category: item.category ?? null,
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return !trimmed || trimmed === '' ? null : trimmed;
}

function validateSkill(body: SkillBody): void {
  const validator = new Validator();
  validator.ruleFor('Name', typeof body.name === 'string' ? body.name : null).notEmpty().maximumLength(120);
  validator
    .ruleFor('Level', body.level ?? null)
    .must((level) => level === null || level === undefined || (typeof level === 'number' && level >= 1 && level <= 5))
    .withMessage('Level must be between 1 and 5.');
  validator.ruleFor('Category', typeof body.category === 'string' ? body.category : null).maximumLength(50);
  validator.throwIfInvalid();
}

@Controller('api/profile/skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(SkillEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return items.map(toDto);
  }

  @Post()
  @HttpCode(200)
  async create(@ReqUser() current: CurrentUser, @Body() body: SkillBody) {
    validateSkill(body);
    const profileId = await this.profileService.getCurrentProfileId(current);

    const item: SkillEntity = {
      id: randomUUID(),
      profileId,
      name: body.name!.trim(),
      level: body.level ?? null,
      category: normalize(body.category),
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.dataSource.getRepository(SkillEntity).insert(item);
    return toDto(item);
  }

  @Put(':id')
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: SkillBody,
  ) {
    validateSkill(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(SkillEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Skill not found.');
    }

    item.name = body.name!.trim();
    item.level = body.level ?? null;
    item.category = normalize(body.category);
    item.sortOrder = body.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      {
        name: item.name,
        level: item.level,
        category: item.category,
        sortOrder: item.sortOrder,
        updatedAt: item.updatedAt,
      },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(SkillEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Skill not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
