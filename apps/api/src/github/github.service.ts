import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { CurrentUser } from '../auth/jwt-auth.guard';
import { AppValidationException, NotFoundException } from '../common/exceptions';
import { getConfig } from '../config/env';
import { ProfileEntity, ProjectEntity, SkillEntity, SocialLinkEntity } from '../database/entities';
import { SkillCatalogService } from '../sections/skill-catalog';

/** Tunables — see the Phase 1 plan. Top languages become skills. */
const MAX_SKILLS = 8;
const CACHE_TTL_MS = 10 * 60_000;

/** GitHub username rules: 1–39 chars, alphanumeric or single hyphens, no leading/trailing hyphen. */
const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export interface GithubPreviewProject {
  name: string;
  description: string | null;
  githubUrl: string;
  liveUrl: string | null;
  stars: number;
  language: string | null;
  fork: boolean;
}

export interface GithubPreviewSkill {
  name: string;
  category: string;
  level: number;
}

export interface GithubPreviewSocialLink {
  platform: string;
  url: string;
}

/** Mapped GitHub data ready to render (preview) or persist (import). Field names mirror the entities. */
export interface GithubPreview {
  username: string;
  profile: {
    fullName: string;
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
  };
  projects: GithubPreviewProject[];
  skills: GithubPreviewSkill[];
  socialLinks: GithubPreviewSocialLink[];
  stats: { publicRepos: number; followers: number };
}

export interface GithubImportResult {
  username: string;
  projectsAdded: number;
  skillsAdded: number;
  socialLinksAdded: number;
}

interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
}

interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  fork: boolean;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/** Coerces a GitHub URL/blog field to a stored http(s) URL, or null if unusable. */
function normalizeUrl(value: string | null | undefined, max: number): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
  } catch {
    return null;
  }
  return candidate.length > max ? null : candidate;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger('Github');
  private readonly cache = new Map<string, { value: GithubPreview; expiresAt: number }>();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly catalog: SkillCatalogService,
  ) {}

  /** Public path: read GitHub and return the mapped preview without persisting anything. */
  async fetchPreview(rawUsername: string): Promise<GithubPreview> {
    const username = this.validateUsername(rawUsername);

    const cached = this.readCache(username);
    if (cached) {
      return cached;
    }

    const [user, repos] = await Promise.all([
      this.githubGet<GithubUser>(`/users/${username}`),
      this.githubGet<GithubRepo[]>(`/users/${username}/repos?per_page=100&sort=pushed`),
    ]);

    const preview = this.mapPreview(user, Array.isArray(repos) ? repos : []);
    this.writeCache(username, preview);
    return preview;
  }

  /**
   * Authenticated path: map GitHub data into the current user's profile.
   * `profileOverrides` carries the user's edits from the review step (fill-empty only,
   * same as GitHub-sourced fields); `selectedRepoNames` restricts which repos become
   * projects — unknown names are ignored rather than rejected (stale client state).
   */
  async importForUser(
    current: CurrentUser,
    rawUsername: string,
    profileOverrides: { fullName?: string; bio?: string; location?: string } | undefined,
    selectedRepoNames: string[],
  ): Promise<GithubImportResult> {
    const preview = await this.fetchPreview(rawUsername);
    const now = new Date();

    if (profileOverrides) {
      if (profileOverrides.fullName?.trim()) preview.profile.fullName = truncate(profileOverrides.fullName, 160);
      if (profileOverrides.bio?.trim()) preview.profile.bio = truncate(profileOverrides.bio, 1000);
      if (profileOverrides.location?.trim()) preview.profile.location = truncate(profileOverrides.location, 160);
    }

    const selected = new Set((selectedRepoNames ?? []).map((name) => name.toLowerCase()));
    const selectedProjects = preview.projects.filter((project) => selected.has(project.name.toLowerCase()));

    const counts = await this.dataSource.transaction(async (manager) => {
      const profileId = await this.resolveOrCreateProfile(manager, current.userId, preview, now);

      const projectsAdded = await this.insertProjects(manager, profileId, selectedProjects, now);
      const skillsAdded = await this.insertSkills(manager, profileId, preview.skills, now);
      const socialLinksAdded = await this.insertSocialLinks(manager, profileId, preview.socialLinks, now);

      return { projectsAdded, skillsAdded, socialLinksAdded };
    });

    return { username: preview.username, ...counts };
  }

  /**
   * Returns the user's profile id, creating a profile from GitHub data when none
   * exists yet so a freshly-signed-up user can import in one step. On an existing
   * profile, only empty header fields are filled — never clobber the user's data.
   */
  private async resolveOrCreateProfile(
    manager: EntityManager,
    userId: string,
    preview: GithubPreview,
    now: Date,
  ): Promise<string> {
    const profiles = manager.getRepository(ProfileEntity);
    const existing = await profiles.findOne({ where: { userId } });

    if (!existing) {
      const profile: ProfileEntity = {
        id: randomUUID(),
        userId,
        templateId: null,
        fullName: preview.profile.fullName,
        title: null,
        bio: preview.profile.bio,
        location: preview.profile.location,
        avatarUrl: preview.profile.avatarUrl,
        createdAt: now,
        updatedAt: null,
      };
      await profiles.insert(profile);
      return profile.id;
    }

    const patch: Partial<ProfileEntity> = {};
    if (!existing.bio && preview.profile.bio) patch.bio = preview.profile.bio;
    if (!existing.location && preview.profile.location) patch.location = preview.profile.location;
    if (!existing.avatarUrl && preview.profile.avatarUrl) patch.avatarUrl = preview.profile.avatarUrl;
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = now;
      await profiles.update({ id: existing.id }, patch);
    }
    return existing.id;
  }

  private async insertProjects(
    manager: EntityManager,
    profileId: string,
    projects: GithubPreviewProject[],
    now: Date,
  ): Promise<number> {
    const repository = manager.getRepository(ProjectEntity);
    const existing = await repository.find({ where: { profileId }, select: { name: true } });
    const taken = new Set(existing.map((item) => item.name.toLowerCase()));
    let order = existing.length;
    let added = 0;

    for (const project of projects) {
      if (taken.has(project.name.toLowerCase())) {
        continue;
      }
      await repository.insert({
        id: randomUUID(),
        profileId,
        name: project.name,
        description: project.description,
        githubUrl: project.githubUrl,
        isRepositoryPrivate: false,
        liveUrl: project.liveUrl,
        sortOrder: order++,
        createdAt: now,
        updatedAt: null,
      });
      taken.add(project.name.toLowerCase());
      added++;
    }

    return added;
  }

  private async insertSkills(
    manager: EntityManager,
    profileId: string,
    skills: GithubPreviewSkill[],
    now: Date,
  ): Promise<number> {
    const repository = manager.getRepository(SkillEntity);
    const existing = await repository.find({ where: { profileId }, select: { name: true } });
    const taken = new Set(existing.map((item) => item.name.toLowerCase()));
    let order = existing.length;
    let added = 0;

    for (const skill of skills) {
      if (taken.has(skill.name.toLowerCase())) {
        continue;
      }
      await repository.insert({
        id: randomUUID(),
        profileId,
        name: skill.name,
        level: skill.level,
        category: skill.category,
        sortOrder: order++,
        createdAt: now,
        updatedAt: null,
      });
      taken.add(skill.name.toLowerCase());
      await this.catalog.record('skill', skill.name);
      await this.catalog.record('category', skill.category);
      added++;
    }

    return added;
  }

  private async insertSocialLinks(
    manager: EntityManager,
    profileId: string,
    links: GithubPreviewSocialLink[],
    now: Date,
  ): Promise<number> {
    const repository = manager.getRepository(SocialLinkEntity);
    const existing = await repository.find({ where: { profileId }, select: { platform: true } });
    const taken = new Set(existing.map((item) => item.platform.toLowerCase()));
    let order = existing.length;
    let added = 0;

    for (const link of links) {
      if (taken.has(link.platform.toLowerCase())) {
        continue;
      }
      await repository.insert({
        id: randomUUID(),
        profileId,
        platform: link.platform,
        url: link.url,
        sortOrder: order++,
        createdAt: now,
        updatedAt: null,
      });
      taken.add(link.platform.toLowerCase());
      added++;
    }

    return added;
  }

  private mapPreview(user: GithubUser, repos: GithubRepo[]): GithubPreview {
    const owned = repos.filter((repo) => !repo.fork);

    // No prefilter, no cap: every repo (owned + forked) is shown so the user picks which become projects.
    const ranked = [...repos].sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    });

    const projects: GithubPreviewProject[] = ranked.map((repo) => ({
      name: truncate(repo.name, 200),
      description: repo.description ? truncate(repo.description, 1000) : null,
      githubUrl: repo.html_url,
      liveUrl: normalizeUrl(repo.homepage, 255),
      stars: repo.stargazers_count,
      language: repo.language,
      fork: repo.fork,
    }));

    return {
      username: user.login,
      profile: {
        fullName: truncate(user.name?.trim() || user.login, 160),
        bio: user.bio ? truncate(user.bio, 1000) : null,
        location: user.location ? truncate(user.location, 160) : null,
        avatarUrl: user.avatar_url ? truncate(user.avatar_url, 2048) : null,
      },
      projects,
      skills: this.buildSkills(owned),
      socialLinks: this.buildSocialLinks(user),
      stats: { publicRepos: user.public_repos, followers: user.followers },
    };
  }

  /** Aggregates primary languages across all owned repos; frequency drives the 1–5 level. */
  private buildSkills(repos: GithubRepo[]): GithubPreviewSkill[] {
    const counts = new Map<string, number>();
    for (const repo of repos) {
      const language = repo.language?.trim();
      if (!language) {
        continue;
      }
      counts.set(language, (counts.get(language) ?? 0) + 1);
    }
    if (counts.size === 0) {
      return [];
    }

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_SKILLS);
    const max = ranked[0][1];

    return ranked.map(([name, count]) => ({
      name: truncate(name, 120),
      category: 'Language',
      level: Math.max(1, Math.min(5, Math.round((count / max) * 5))),
    }));
  }

  private buildSocialLinks(user: GithubUser): GithubPreviewSocialLink[] {
    const links: GithubPreviewSocialLink[] = [{ platform: 'github', url: truncate(user.html_url, 255) }];
    const website = normalizeUrl(user.blog, 255);
    if (website) {
      links.push({ platform: 'website', url: website });
    }
    return links;
  }

  private validateUsername(raw: string): string {
    const value = (raw ?? '').trim();
    if (!USERNAME_PATTERN.test(value)) {
      throw new AppValidationException({ Username: ['Enter a valid GitHub username.'] });
    }
    return value;
  }

  private async githubGet<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Procraft',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    const token = getConfig().github.token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`https://api.github.com${path}`, { headers });
    } catch (error) {
      this.logger.error(`GitHub request failed: ${path}`, error instanceof Error ? error.stack : String(error));
      throw new HttpException('GitHub is temporarily unavailable. Please try again.', HttpStatus.BAD_GATEWAY);
    }

    if (response.status === 404) {
      throw new NotFoundException('GitHub user not found.');
    }
    // 403/429 from GitHub means the (unauthenticated or token) rate limit is exhausted.
    if (response.status === 403 || response.status === 429) {
      throw new HttpException('GitHub rate limit reached. Please try again shortly.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    if (!response.ok) {
      throw new HttpException('GitHub is temporarily unavailable. Please try again.', HttpStatus.BAD_GATEWAY);
    }

    return (await response.json()) as T;
  }

  private readCache(username: string): GithubPreview | null {
    const entry = this.cache.get(username.toLowerCase());
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(username.toLowerCase());
      return null;
    }
    return entry.value;
  }

  private writeCache(username: string, value: GithubPreview): void {
    this.cache.set(username.toLowerCase(), { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }
}
