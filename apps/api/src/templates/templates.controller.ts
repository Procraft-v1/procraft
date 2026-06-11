import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TemplateEntity } from '../database/entities';

/** Port of TemplatesController + GetTemplatesQueryHandler. */
@Controller('api/templates')
export class TemplatesController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async getTemplates() {
    const templates = await this.dataSource.getRepository(TemplateEntity).find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      slug: template.slug,
      previewUrl: template.previewUrl ?? null,
      isActive: template.isActive,
      isPremium: template.isPremium,
    }));
  }
}
