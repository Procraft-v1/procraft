import { Injectable, Logger } from '@nestjs/common';

/** Port of the C# TelegramBotService placeholder — logs instead of sending. */
@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  async notify(message: string): Promise<void> {
    this.logger.warn(
      `Telegram stub is active: no real notification was sent. Message=${message}. Configure TelegramBotService before production notifications.`,
    );
  }
}
