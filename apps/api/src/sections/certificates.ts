import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { isValidDateOnly, toDateOnlyString, toDateTimeOffsetString } from '../common/dates';
import { NotFoundException } from '../common/exceptions';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { Validator } from '../common/validation';
import { CertificateEntity } from '../database/entities';
import { ProfileService } from '../profile/profile.service';
import { FileStorageService } from '../storage/file-storage.service';

/** RequestSizeLimit on the C# controller: payloads beyond this are rejected with 413. */
const CERTIFICATE_UPLOAD_REQUEST_LIMIT_BYTES = 11 * 1024 * 1024;
const MAX_CERTIFICATE_SIZE_BYTES = 10 * 1024 * 1024;
const CERTIFICATES_FOLDER = 'certificates';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

interface CertificateBody {
  name?: string;
  issuer?: string | null;
  issuedOn?: string | null;
  url?: string | null;
  sortOrder?: number | string | null;
}

interface ParsedCertificateRequest {
  name: string;
  issuer: string | null;
  issuedOn: string | null;
  url: string | null;
  sortOrder: number | null;
}

function toDto(item: CertificateEntity) {
  return {
    id: item.id,
    name: item.name,
    issuer: item.issuer ?? null,
    issuedOn: toDateOnlyString(item.issuedOn),
    url: item.url ?? null,
    sortOrder: item.sortOrder,
    createdAt: toDateTimeOffsetString(item.createdAt),
    updatedAt: toDateTimeOffsetString(item.updatedAt),
  };
}

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return !trimmed || trimmed === '' ? null : trimmed;
}

function hasAllowedExtension(fileName: string | null | undefined): boolean {
  if (!fileName || fileName.trim() === '') {
    return false;
  }
  const dot = fileName.lastIndexOf('.');
  const extension = dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
  return ALLOWED_EXTENSIONS.includes(extension);
}

function hasAllowedContentType(contentType: string | null | undefined): boolean {
  return !!contentType && ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase());
}

/** Form fields arrive as strings under multipart; JSON keeps native types. */
function parseRequest(body: CertificateBody): ParsedCertificateRequest {
  const validator = new Validator();

  const name = typeof body.name === 'string' ? body.name : null;
  validator.ruleFor('Name', name).notEmpty().maximumLength(200);

  const issuer = typeof body.issuer === 'string' ? body.issuer : null;
  validator.ruleFor('Issuer', issuer).maximumLength(100);

  const url = typeof body.url === 'string' ? body.url : null;
  validator.ruleFor('Url', url).maximumLength(255);

  let issuedOn: string | null = null;
  if (typeof body.issuedOn === 'string' && body.issuedOn !== '') {
    if (isValidDateOnly(body.issuedOn)) {
      issuedOn = body.issuedOn;
    } else {
      validator.ruleFor('IssuedOn', body.issuedOn).must(() => false);
    }
  }

  let sortOrder: number | null = null;
  if (body.sortOrder !== undefined && body.sortOrder !== null && body.sortOrder !== '') {
    const parsed = typeof body.sortOrder === 'number' ? body.sortOrder : Number(body.sortOrder);
    if (Number.isFinite(parsed)) {
      sortOrder = Math.trunc(parsed);
    } else {
      validator.ruleFor('SortOrder', body.sortOrder).must(() => false);
    }
  }

  validator.throwIfInvalid();

  return { name: name!, issuer, issuedOn, url, sortOrder };
}

function validateFile(file: Express.Multer.File | undefined, required: boolean): void {
  if (!file && !required) {
    return;
  }

  const validator = new Validator();

  if (required) {
    validator.ruleFor('FileStream', file ? file.buffer : null).notNull();
  }

  validator
    .ruleFor('FileName', file?.originalname ?? null)
    .notEmpty()
    .must((value) => hasAllowedExtension(typeof value === 'string' ? value : null))
    .withMessage('Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file.');

  validator
    .ruleFor('ContentType', file?.mimetype ?? null)
    .notEmpty()
    .must((value) => hasAllowedContentType(typeof value === 'string' ? value : null))
    .withMessage('Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file.');

  validator
    .ruleFor('FileSizeBytes', file?.size ?? 0)
    .greaterThan(0)
    .lessThanOrEqualTo(MAX_CERTIFICATE_SIZE_BYTES)
    .withMessage('Certificate file must be 10MB or smaller.');

  validator.throwIfInvalid();
}

@Controller('api/profile/certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
    private readonly fileStorage: FileStorageService,
  ) {}

  @Get()
  async getAll(@ReqUser() current: CurrentUser) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const items = await this.dataSource.getRepository(CertificateEntity).find({
      where: { profileId },
      order: { sortOrder: 'ASC', issuedOn: 'DESC' },
    });
    return items.map(toDto);
  }

  @Post()
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: CERTIFICATE_UPLOAD_REQUEST_LIMIT_BYTES } }))
  async create(
    @ReqUser() current: CurrentUser,
    @Body() body: CertificateBody,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const request = parseRequest(body);
    if (file) {
      validateFile(file, false);
    }

    const profileId = await this.profileService.getCurrentProfileId(current);

    let url = request.url;
    if (file) {
      url = await this.fileStorage.save(file.buffer, file.originalname, file.mimetype, CERTIFICATES_FOLDER);
    }

    const item: CertificateEntity = {
      id: randomUUID(),
      profileId,
      name: request.name.trim(),
      issuer: normalize(request.issuer),
      issuedOn: request.issuedOn,
      url,
      sortOrder: request.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.dataSource.getRepository(CertificateEntity).insert(item);
    return toDto(item);
  }

  @Post('file')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: CERTIFICATE_UPLOAD_REQUEST_LIMIT_BYTES } }))
  async uploadFile(@ReqUser() current: CurrentUser, @UploadedFile() file?: Express.Multer.File) {
    validateFile(file, true);
    await this.profileService.getCurrentProfileId(current);

    const url = await this.fileStorage.save(file!.buffer, file!.originalname, file!.mimetype, CERTIFICATES_FOLDER);
    return { url };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: CERTIFICATE_UPLOAD_REQUEST_LIMIT_BYTES } }))
  async update(
    @ReqUser() current: CurrentUser,
    @Param('id', GuidRouteParam) id: string,
    @Body() body: CertificateBody,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const request = parseRequest(body);
    if (file) {
      validateFile(file, false);
    }

    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(CertificateEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Certificate not found.');
    }

    item.name = request.name.trim();
    item.issuer = normalize(request.issuer);
    item.issuedOn = request.issuedOn;
    item.url = normalize(request.url);

    if (file) {
      item.url = await this.fileStorage.save(file.buffer, file.originalname, file.mimetype, CERTIFICATES_FOLDER);
    }

    item.sortOrder = request.sortOrder ?? item.sortOrder;
    item.updatedAt = new Date();

    await repository.update(
      { id: item.id },
      {
        name: item.name,
        issuer: item.issuer,
        issuedOn: item.issuedOn,
        url: item.url,
        sortOrder: item.sortOrder,
        updatedAt: item.updatedAt,
      },
    );

    return toDto(item);
  }

  @Delete(':id')
  async remove(@ReqUser() current: CurrentUser, @Param('id', GuidRouteParam) id: string) {
    const profileId = await this.profileService.getCurrentProfileId(current);
    const repository = this.dataSource.getRepository(CertificateEntity);
    const item = await repository.findOne({ where: { id, profileId } });

    if (!item) {
      throw new NotFoundException('Certificate not found.');
    }

    const dto = toDto(item);
    await repository.delete({ id: item.id });
    return dto;
  }
}
