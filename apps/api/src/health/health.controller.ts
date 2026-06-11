import { Controller, Get } from '@nestjs/common';

/** /health (gateway probe) and /api/health (proxied symmetry), like the C# host. */
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'Healthy' };
  }

  @Get('api/health')
  apiHealth() {
    return { status: 'Healthy' };
  }
}
