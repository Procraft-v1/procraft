import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { compareDateOnly, isValidDateOnly, toDateOnlyString, toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { WorkExperienceEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';

interface ExperienceBody {
  company?: string;
  experienceType?: string;
  position?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  sortOrder?: number | null;
}

const EXPERIENCE_TYPES = ['work', 'freelance', 'project', 'internship', 'volunteer'];

function normalizeExperienceType(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized && EXPERIENCE_TYPES.includes(normalized) ? normalized : 'work';
}

function toDto(item: WorkExperienceEntity) {
  return {
    id: item.id,
    company: item.company,
    experienceType: item.experienceType,
    position: item.position,
    description: item.description ?? null,
    startDate: toDateOnlyString(item.startDate),
    endDate: toDateOnlyString(item.endDate),
    isCurrent: item.isCurrent,
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return !trimmed || trimmed === '' ? null : trimmed;
}

function validateBody(body: ExperienceBody): void {
  const validator = new Validator();

  validator.ruleFor('Company', typeof body.company === 'string' ? body.company : null).notEmpty().maximumLength(200);

  validator
    .ruleFor('ExperienceType', typeof body.experienceType === 'string' ? body.experienceType : null)
    .must((value) => typeof value === 'string' && EXPERIENCE_TYPES.includes(value.trim().toLowerCase()));

  validator.ruleFor('Position', typeof body.position === 'string' ? body.position : null).notEmpty().maximumLength(200);

  const startDateValid = typeof body.startDate === 'string' && isValidDateOnly(body.startDate);
  const startRule = validator.ruleFor('StartDate', startDateValid ? body.startDate! : null).notEmpty();
  if (body.startDate !== undefined && body.startDate !== null && !startDateValid) {
    startRule.must(() => false);
  }

  validator
    .ruleFor('Description', typeof body.description === 'string' ? body.description : null)
    .maximumLength(1000);

  const endDate = typeof body.endDate === 'string' && body.endDate !== '' ? body.endDate : null;
  if (endDate !== null && !isValidDateOnly(endDate)) {
    validator.ruleFor('EndDate', endDate).must(() => false);
  } else {
    validator
      .ruleFor('EndDate', endDate)
      .must((value) => {
        if (value === null || value === undefined) {
          return true;
        }
        if (!startDateValid) {
          return true;
        }
        return compareDateOnly(String(value), body.startDate!) >= 0;
      })
      .withMessage('End date must be greater than or equal to start date.');
  }

  validator.throwIfInvalid();
}

@Controller('api/profile/experiences')
@UseGuards(JwtAuthGuard)
export class ExperiencesController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(WorkExperienceEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', startDate: 'DESC' },
    });
    return items.map(toDto);
  }

  @Post()
  @HttpCode(200)
  async create(@ReqUser() current: CurrentUser, @Body() body: ExperienceBody) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const isCurrent = body.isCurrent === true;

    const item: WorkExperienceEntity = {
      id: randomUUID(),
      profileId,
      company: body.company!.trim(),
      experienceType: normalizeExperienceType(body.experienceType),
      position: body.position!.trim(),
      description: normalize(body.description),
      startDate: body.startDate!,
      endDate: isCurrent ? null : (typeof body.endDate === 'string' && body.endDate !== '' ? body.endDate : null),
      isCurrent,
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.dataSource.getRepository(WorkExperienceEntity).insert(item);
    return toDto(item);
  }

  @Put(':id')
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: ExperienceBody,
  ) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(WorkExperienceEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Experience not found.');
    }

    const isCurrent = body.isCurrent === true;

    item.company = body.company!.trim();
    item.experienceType = normalizeExperienceType(body.experienceType);
    item.position = body.position!.trim();
    item.description = normalize(body.description);
    item.startDate = body.startDate!;
    item.endDate = isCurrent ? null : (typeof body.endDate === 'string' && body.endDate !== '' ? body.endDate : null);
    item.isCurrent = isCurrent;
    item.sortOrder = body.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      {
        company: item.company,
        experienceType: item.experienceType,
        position: item.position,
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate,
        isCurrent: item.isCurrent,
        sortOrder: item.sortOrder,
        updatedAt: item.updatedAt,
      },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(WorkExperienceEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Experience not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
