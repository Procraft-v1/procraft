import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { GithubService } from './github.service';

interface ImportBody {
  username?: string;
  profile?: { fullName?: string; bio?: string; location?: string };
  selectedRepoNames?: string[];
  selectedSkillNames?: string[];
  selectedSocialPlatforms?: string[];
}

@Controller('api/github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  /**
   * Public "aha" preview — maps a GitHub username to a ready profile without
   * persisting anything. Intentionally unauthenticated so it works before signup.
   */
  @Get('preview/:username')
  async preview(@Param('username') username: string) {
    return this.githubService.fetchPreview(username);
  }

  /** Persists the mapped GitHub data into the current user's profile. */
  @Post('import')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async import(@ReqUser() current: CurrentUser, @Body() body: ImportBody) {
    return this.githubService.importForUser(
      current,
      body.username ?? '',
      body.profile,
      body.selectedRepoNames ?? [],
      body.selectedSkillNames ?? [],
      body.selectedSocialPlatforms ?? [],
    );
  }
}
