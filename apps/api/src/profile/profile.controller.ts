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
import { Validator } from '../common/validation';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { GuidRouteParam } from '../common/guid-param.pipe';
import { ProfileService } from './profile.service';

interface ProfileBody {
  fullName?: string;
  title?: string | null;
  bio?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function validateProfileBody(body: ProfileBody): void {
  const validator = new Validator();
  validator.ruleFor('FullName', str(body.fullName)).notEmpty().maximumLength(160);
  validator.ruleFor('Title', str(body.title)).maximumLength(100);
  validator.ruleFor('Bio', str(body.bio)).maximumLength(1000);
  validator.ruleFor('Location', str(body.location)).maximumLength(160);
  validator.ruleFor('AvatarUrl', str(body.avatarUrl)).maximumLength(2048);
  validator.throwIfInvalid();
}

const AVATAR_UPLOAD_LIMIT_BYTES = 6 * 1024 * 1024;

@Controller('api/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@ReqUser() current: CurrentUser) {
    return this.profileService.getMyProfile(current);
  }

  @Post()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  createProfile(@ReqUser() current: CurrentUser, @Body() body: ProfileBody) {
    validateProfileBody(body);
    return this.profileService.createProfile(
      current,
      body.fullName!,
      str(body.title),
      str(body.bio),
      str(body.location),
      str(body.avatarUrl),
    );
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  updateProfile(@ReqUser() current: CurrentUser, @Body() body: ProfileBody) {
    validateProfileBody(body);
    return this.profileService.updateProfile(
      current,
      body.fullName!,
      str(body.title),
      str(body.bio),
      str(body.location),
      str(body.avatarUrl),
    );
  }

  @Post('template/:templateId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  selectTemplate(@ReqUser() current: CurrentUser, @Param('templateId', GuidRouteParam) templateId: string) {
    return this.profileService.selectTemplate(current, templateId);
  }

  @Post('avatar')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: AVATAR_UPLOAD_LIMIT_BYTES } }))
  uploadAvatar(@ReqUser() current: CurrentUser, @UploadedFile() file?: Express.Multer.File) {
    validateAvatarUpload(file);
    return this.profileService.uploadAvatar(current, file!.buffer, file!.originalname, file!.mimetype);
  }

  @Delete('avatar')
  @UseGuards(JwtAuthGuard)
  deleteAvatar(@ReqUser() current: CurrentUser) {
    return this.profileService.deleteAvatar(current);
  }

  /** Declared last so /me, /template, /avatar and section routes win over the catch-all. */
  @Get(':username')
  getPublicProfile(@Param('username') username: string) {
    const validator = new Validator();
    validator.ruleFor('Username', username).notEmpty().minimumLength(3).maximumLength(30);
    validator.throwIfInvalid();
    return this.profileService.getPublicProfile(username);
  }
}

const AVATAR_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const AVATAR_ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

/** Port of UploadProfileAvatarCommandValidator. */
function validateAvatarUpload(file?: Express.Multer.File): void {
  const validator = new Validator();

  validator.ruleFor('FileStream', file ? file.buffer : null).notNull();

  validator
    .ruleFor('FileName', file?.originalname ?? null)
    .notEmpty()
    .must((value) => {
      if (typeof value !== 'string' || value.trim() === '') {
        return false;
      }
      const dot = value.lastIndexOf('.');
      const extension = dot >= 0 ? value.slice(dot).toLowerCase() : '';
      return AVATAR_ALLOWED_EXTENSIONS.includes(extension);
    })
    .withMessage('Avatar must be a JPG, JPEG, PNG, or WEBP image.');

  validator
    .ruleFor('ContentType', file?.mimetype ?? null)
    .notEmpty()
    .must((value) => typeof value === 'string' && AVATAR_ALLOWED_CONTENT_TYPES.includes(value.toLowerCase()))
    .withMessage('Avatar must be a JPG, JPEG, PNG, or WEBP image.');

  validator
    .ruleFor('FileSizeBytes', file?.size ?? 0)
    .greaterThan(0)
    .lessThanOrEqualTo(MAX_AVATAR_SIZE_BYTES)
    .withMessage('Avatar must be 5MB or smaller.');

  validator.throwIfInvalid();
}
