import { Controller, Get, Injectable, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkillCatalogEntryEntity } from '../database/entities';

export type SkillCatalogKind = 'skill' | 'category';

/**
 * Global, cross-profile suggestion catalog. Any skill name or category a user
 * saves is recorded here once, so it becomes an autocomplete suggestion for
 * everyone. Reads are global; writes are best-effort and idempotent.
 */
@Injectable()
export class SkillCatalogService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getCatalog(): Promise<{ skills: string[]; categories: string[] }> {
    const rows = await this.dataSource
      .getRepository(SkillCatalogEntryEntity)
      .find({ order: { name: 'ASC' } });

    return {
      skills: rows.filter((row) => row.kind === 'skill').map((row) => row.name),
      categories: rows.filter((row) => row.kind === 'category').map((row) => row.name),
    };
  }

  /**
   * Idempotent global upsert. Never throws into the caller's request path —
   * the catalog is a convenience layer and must not break skill saving.
   */
  async record(kind: SkillCatalogKind, rawName: string | null | undefined): Promise<void> {
    const name = rawName?.trim();
    if (!name) {
      return;
    }

    try {
      await this.dataSource
        .getRepository(SkillCatalogEntryEntity)
        .createQueryBuilder()
        .insert()
        .values({
          id: randomUUID(),
          kind,
          name: name.slice(0, 120),
          createdAt: new Date(),
          updatedAt: null,
        })
        .orIgnore() // ON CONFLICT ("Kind", "Name") DO NOTHING
        .execute();
    } catch {
      // Best-effort: a catalog write failure must not surface to the user.
    }
  }
}

@Controller('api/skill-catalog')
@UseGuards(JwtAuthGuard)
export class SkillCatalogController {
  constructor(private readonly catalog: SkillCatalogService) {}

  @Get()
  getAll() {
    return this.catalog.getCatalog();
  }
}
