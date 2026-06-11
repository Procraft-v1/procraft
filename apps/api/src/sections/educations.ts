import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { compareDateOnly, isValidDateOnly, toDateOnlyString, toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { EducationEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';

interface EducationBody {
  institution?: string;
  educationType?: string;
  degree?: string | null;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number | null;
}

const EDUCATION_TYPES = ['formal', 'course', 'self', 'mentor', 'online'];

function normalizeEducationType(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized && EDUCATION_TYPES.includes(normalized) ? normalized : 'formal';
}

function toDto(item: EducationEntity) {
  return {
    id: item.id,
    institution: item.institution,
    educationType: item.educationType,
    degree: item.degree ?? null,
    field: item.field ?? null,
    startDate: toDateOnlyString(item.startDate),
    endDate: toDateOnlyString(item.endDate),
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return !trimmed || trimmed === '' ? null : trimmed;
}

function optionalDate(value: string | null | undefined): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function validateBody(body: EducationBody): void {
  const validator = new Validator();

  validator
    .ruleFor('Institution', typeof body.institution === 'string' ? body.institution : null)
    .notEmpty()
    .maximumLength(200);

  validator
    .ruleFor('EducationType', typeof body.educationType === 'string' ? body.educationType : null)
    .must((value) => typeof value === 'string' && EDUCATION_TYPES.includes(value.trim().toLowerCase()));

  validator.ruleFor('Degree', typeof body.degree === 'string' ? body.degree : null).maximumLength(100);
  validator.ruleFor('Field', typeof body.field === 'string' ? body.field : null).maximumLength(100);

  const startDate = optionalDate(body.startDate);
  const endDate = optionalDate(body.endDate);

  if (startDate !== null && !isValidDateOnly(startDate)) {
    validator.ruleFor('StartDate', startDate).must(() => false);
  }

  if (endDate !== null && !isValidDateOnly(endDate)) {
    validator.ruleFor('EndDate', endDate).must(() => false);
  } else {
    validator
      .ruleFor('EndDate', endDate)
      .must((value) => {
        if (value === null || value === undefined) {
          return true;
        }
        if (startDate === null || !isValidDateOnly(startDate)) {
          return true;
        }
        return compareDateOnly(String(value), startDate) >= 0;
      })
      .withMessage('End date must be greater than or equal to start date.');
  }

  validator.throwIfInvalid();
}

@Controller('api/profile/educations')
@UseGuards(JwtAuthGuard)
export class EducationsController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(EducationEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', startDate: 'DESC' },
    });
    return items.map(toDto);
  }

  @Post()
  @HttpCode(200)
  async create(@ReqUser() current: CurrentUser, @Body() body: EducationBody) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);

    const item: EducationEntity = {
      id: randomUUID(),
      profileId,
      institution: body.institution!.trim(),
      educationType: normalizeEducationType(body.educationType),
      degree: normalize(body.degree),
      field: normalize(body.field),
      startDate: optionalDate(body.startDate),
      endDate: optionalDate(body.endDate),
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.dataSource.getRepository(EducationEntity).insert(item);
    return toDto(item);
  }

  @Put(':id')
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: EducationBody,
  ) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(EducationEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Education not found.');
    }

    item.institution = body.institution!.trim();
    item.educationType = normalizeEducationType(body.educationType);
    item.degree = normalize(body.degree);
    item.field = normalize(body.field);
    item.startDate = optionalDate(body.startDate);
    item.endDate = optionalDate(body.endDate);
    item.sortOrder = body.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      {
        institution: item.institution,
        educationType: item.educationType,
        degree: item.degree,
        field: item.field,
        startDate: item.startDate,
        endDate: item.endDate,
        sortOrder: item.sortOrder,
        updatedAt: item.updatedAt,
      },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(EducationEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Education not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
