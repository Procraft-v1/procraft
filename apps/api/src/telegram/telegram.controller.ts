import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { TelegramBotService } from './telegram.service';

@Controller('api/telegram')
export class TelegramController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() update: Record<string, unknown>): Promise<{ ok: boolean }> {
    await this.telegramBotService.handleUpdate(update as never);
    return { ok: true };
  }
}
