import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { ProfileEntity, TemplateEntity, UserEntity } from './entities';
import { PasswordHasher } from '../auth/password-hasher';

/** Port of Procraft.Infrastructure.Persistence.Seed.TemplateSeeder (idempotent upsert by slug). */
export async function seedTemplates(dataSource: DataSource): Promise<void> {
  const now = new Date();
  const templates: Array<{ name: string; slug: string; description: string; previewUrl: string | null }> = [
    { name: 'Minimal', slug: 'minimal', description: 'Clean typography-forward layout.', previewUrl: null },
    { name: 'Modern', slug: 'modern', description: 'Card-based modern layout.', previewUrl: null },
    { name: 'Classic', slug: 'classic', description: 'Traditional chronological resume.', previewUrl: null },
    {
      name: 'Editorial',
      slug: 'editorial',
      description: 'Magazine-style editorial portfolio.',
      previewUrl: '/templates/editorial.svg',
    },
    {
      name: 'Developer',
      slug: 'developer',
      description: 'Dark terminal and code editor portfolio for developers.',
      previewUrl: '/templates/developer.svg',
    },
  ];

  const repository = dataSource.getRepository(TemplateEntity);

  for (const seed of templates) {
    const existing = await repository.findOne({ where: { slug: seed.slug } });

    if (!existing) {
      await repository.insert({
        id: randomUUID(),
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        previewUrl: seed.previewUrl,
        isActive: true,
        isPremium: false,
        createdAt: now,
        updatedAt: null,
      });
      continue;
    }

    await repository.update(
      { id: existing.id },
      {
        name: seed.name,
        description: seed.description,
        previewUrl: seed.previewUrl,
        isActive: true,
        updatedAt: now,
      },
    );
  }
}

/**
 * Port of StaticAccountSeeder — development only, mirroring Program.cs which
 * gates it behind IsDevelopment(). Errors never block startup.
 */
export async function seedStaticAccount(
  dataSource: DataSource,
  passwordHasher: PasswordHasher,
  logger: Logger,
): Promise<void> {
  const email = 'tulaganovraximjon65@gmail.com';
  const username = 'raximjon';
  const password = '1234';

  try {
    const now = new Date();
    const users = dataSource.getRepository(UserEntity);
    const profiles = dataSource.getRepository(ProfileEntity);
    const templates = dataSource.getRepository(TemplateEntity);

    const matches = await users
      .createQueryBuilder('u')
      .select(['u.id'])
      .where('LOWER(u.email) = :email OR LOWER(u.username) = :username', { email, username })
      .getMany();

    if (matches.length > 1) {
      logger.warn(
        `Static account seed skipped because multiple users match the configured email or username. Email=${email}; Username=${username}; Count=${matches.length}`,
      );
      return;
    }

    let userId: string;

    if (matches.length === 0) {
      userId = randomUUID();
      await users.insert({
        id: userId,
        email,
        username,
        phoneNumber: null,
        passwordHash: passwordHasher.hash(password),
        isEmailConfirmed: true,
        createdAt: now,
        updatedAt: null,
      });
      logger.log(`Static account created. UserId=${userId}; Email=${email}; Username=${username}`);
    } else {
      userId = matches[0].id;
      await users.update(
        { id: userId },
        {
          email,
          username,
          passwordHash: passwordHasher.hash(password),
          isEmailConfirmed: true,
          updatedAt: now,
        },
      );
      logger.log(`Static account updated. UserId=${userId}; Email=${email}; Username=${username}`);
    }

    const hasProfile = await profiles.exists({ where: { userId } });
    if (hasProfile) {
      return;
    }

    const minimal = await templates.findOne({ where: { slug: 'minimal' } });

    await profiles.insert({
      id: randomUUID(),
      userId,
      templateId: minimal?.id ?? null,
      fullName: 'Raximjon Tulaganov',
      title: 'Procraft User',
      bio: null,
      location: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: null,
    });

    logger.log(`Static account profile created. UserId=${userId}; TemplateId=${minimal?.id ?? null}`);
  } catch (error) {
    logger.error(
      `Static account seeding failed. API startup will continue. Email=${email}; Username=${username}`,
      error instanceof Error ? error.stack : String(error),
    );
  }
}
