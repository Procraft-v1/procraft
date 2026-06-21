import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { getConfig } from '../config/env';
import { TelegramBotService } from './telegram.service';

@Controller('api/telegram')
export class TelegramController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() update: Record<string, unknown>,
  ): Promise<{ ok: boolean }> {
    const secret = getConfig().telegram.webhookSecret;
    if (secret) {
      const presented = req.headers['x-telegram-bot-api-secret-token'];
      if (presented !== secret) {
        res.status(403);
        return { ok: false };
      }
    }
    await this.telegramBotService.handleUpdate(update as never);
    return { ok: true };
  }
}
