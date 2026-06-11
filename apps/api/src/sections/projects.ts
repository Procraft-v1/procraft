import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { ProjectEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';

interface ProjectBody {
  name?: string;
  description?: string | null;
  githubUrl?: string | null;
  isRepositoryPrivate?: boolean;
  liveUrl?: string | null;
  sortOrder?: number | null;
}

function toDto(item: ProjectEntity) {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    githubUrl: item.githubUrl ?? null,
    isRepositoryPrivate: item.isRepositoryPrivate,
    liveUrl: item.liveUrl ?? null,
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return !trimmed || trimmed === '' ? null : trimmed;
}

function validateBody(body: ProjectBody): void {
  const validator = new Validator();
  validator.ruleFor('Name', typeof body.name === 'string' ? body.name : null).notEmpty().maximumLength(200);
  validator.ruleFor('Description', typeof body.description === 'string' ? body.description : null).maximumLength(1000);
  validator.ruleFor('GithubUrl', typeof body.githubUrl === 'string' ? body.githubUrl : null).maximumLength(255);
  validator.ruleFor('LiveUrl', typeof body.liveUrl === 'string' ? body.liveUrl : null).maximumLength(255);
  validator.throwIfInvalid();
}

@Controller('api/profile/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(ProjectEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return items.map(toDto);
  }

  @Post()
  @HttpCode(200)
  async create(@ReqUser() current: CurrentUser, @Body() body: ProjectBody) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);

    const item: ProjectEntity = {
      id: randomUUID(),
      profileId,
      name: body.name!.trim(),
      description: normalize(body.description),
      githubUrl: normalize(body.githubUrl),
      isRepositoryPrivate: body.isRepositoryPrivate === true,
      liveUrl: normalize(body.liveUrl),
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.dataSource.getRepository(ProjectEntity).insert(item);
    return toDto(item);
  }

  @Put(':id')
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: ProjectBody,
  ) {
    validateBody(body);
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(ProjectEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Project not found.');
    }

    item.name = body.name!.trim();
    item.description = normalize(body.description);
    item.githubUrl = normalize(body.githubUrl);
    item.isRepositoryPrivate = body.isRepositoryPrivate === true;
    item.liveUrl = normalize(body.liveUrl);
    item.sortOrder = body.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      {
        name: item.name,
        description: item.description,
        githubUrl: item.githubUrl,
        isRepositoryPrivate: item.isRepositoryPrivate,
        liveUrl: item.liveUrl,
        sortOrder: item.sortOrder,
        updatedAt: item.updatedAt,
      },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(ProjectEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Project not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
