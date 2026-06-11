import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { AppValidationException } from '../common/exceptions';
import { getConfig } from '../config/env';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const ALLOWED_CERTIFICATE_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Port of Procraft.Infrastructure.FileStorage.LocalFileStorageService:
 * identical upload root resolution, "{guidN}{ext}" file naming, public URL
 * shape "/uploads/{folder}/{name}" and traversal-safe delete.
 */
@Injectable()
export class FileStorageService {
  async save(buffer: Buffer, fileName: string, contentType: string, folder: string): Promise<string> {
    this.validateFolder(folder);
    this.validateFile(buffer, fileName, contentType, folder);

    const extension = path.extname(fileName).toLowerCase();
    const safeFileName = `${randomUUID().replace(/-/g, '')}${extension}`;
    const rootPath = this.getUploadsRootPath();
    const folderPath = this.getSafeFolderPath(rootPath, folder);
    const targetPath = path.join(folderPath, safeFileName);

    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(targetPath, buffer, { flag: 'wx' });

    return `${this.normalizePublicBasePath()}/${folder}/${safeFileName}`;
  }

  async delete(filePathOrUrl: string | null | undefined): Promise<void> {
    if (!filePathOrUrl || filePathOrUrl.trim() === '') {
      return;
    }

    const rootPath = this.getUploadsRootPath();
    const relativePath = this.getRelativePath(filePathOrUrl);
    const targetPath = path.resolve(rootPath, relativePath);

    if (!this.isInsideRoot(rootPath, targetPath)) {
      throw new AppValidationException({ file: ['Invalid upload path.'] });
    }

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }

  getUploadsRootPath(): string {
    return path.resolve(getConfig().uploads.rootPath);
  }

  private validateFile(buffer: Buffer, fileName: string, contentType: string, folder: string): void {
    if (folder.toLowerCase() === 'certificates') {
      this.validateAgainst(
        buffer,
        fileName,
        contentType,
        ALLOWED_CERTIFICATE_TYPES,
        getConfig().uploads.maxCertificateSizeMb,
        'Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file.',
        (mb) => `Certificate file must be ${mb}MB or smaller.`,
      );
      return;
    }

    this.validateAgainst(
      buffer,
      fileName,
      contentType,
      ALLOWED_IMAGE_TYPES,
      getConfig().uploads.maxAvatarSizeMb,
      'Avatar must be a JPG, JPEG, PNG, or WEBP image.',
      (mb) => `Avatar must be ${mb}MB or smaller.`,
    );
  }

  private validateAgainst(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    allowed: Record<string, string>,
    maxSizeMb: number,
    typeMessage: string,
    sizeMessage: (mb: number) => string,
  ): void {
    const extension = path.extname(fileName).toLowerCase();
    const normalizedContentType = contentType.toLowerCase();

    if (!(extension in allowed) || allowed[extension] !== normalizedContentType) {
      throw new AppValidationException({ file: [typeMessage] });
    }

    if (buffer.length > maxSizeMb * 1024 * 1024) {
      throw new AppValidationException({ file: [sizeMessage(maxSizeMb)] });
    }
  }

  private validateFolder(folder: string): void {
    if (
      !folder ||
      folder.trim() === '' ||
      folder.includes('..') ||
      folder.includes('/') ||
      folder.includes('\\')
    ) {
      throw new AppValidationException({ folder: ['Invalid upload folder.'] });
    }
  }

  private getSafeFolderPath(rootPath: string, folder: string): string {
    const folderPath = path.resolve(rootPath, folder);
    if (!this.isInsideRoot(rootPath, folderPath)) {
      throw new AppValidationException({ folder: ['Invalid upload folder.'] });
    }
    return folderPath;
  }

  private getRelativePath(filePathOrUrl: string): string {
    const normalizedBase = this.normalizePublicBasePath();
    let normalizedValue = filePathOrUrl.replace(/\\/g, '/');

    if (normalizedValue.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
      normalizedValue = normalizedValue.slice(normalizedBase.length).replace(/^\/+/, '');
    }

    return normalizedValue.replace(/^\/+/, '');
  }

  private isInsideRoot(rootPath: string, targetPath: string): boolean {
    const normalizedRoot = path.resolve(rootPath) + path.sep;
    const normalizedTarget = path.resolve(targetPath);
    return normalizedTarget.toLowerCase().startsWith(normalizedRoot.toLowerCase());
  }

  private normalizePublicBasePath(): string {
    const basePath = getConfig().uploads.publicBasePath;
    if (!basePath || basePath.trim() === '') {
      return '/uploads';
    }
    return '/' + basePath.trim().replace(/^\/+|\/+$/g, '');
  }
}
