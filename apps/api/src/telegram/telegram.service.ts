import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomInt } from 'crypto';
import { PendingRegistrationEntity, PasswordResetCodeEntity } from '../database/entities';
import { TokenService } from '../auth/token.service';
import { getConfig } from '../config/env';

const CODE_LENGTH = 4;

function generateCode(): string {
  return randomInt(0, 10_000).toString().padStart(CODE_LENGTH, '0');
}

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    const token = getConfig().telegram.botToken;
    const webhookUrl = getConfig().telegram.webhookUrl;

    if (!token || !webhookUrl) {
      this.logger.warn('Telegram bot token or webhook URL not configured — bot disabled.');
      return;
    }

    try {
      await this.callApi('setWebhook', { url: webhookUrl });
      this.logger.log(`Telegram webhook registered: ${webhookUrl}`);
    } catch (err) {
      this.logger.error('Failed to register Telegram webhook', err);
    }
  }

  /** Called by the webhook controller for every incoming Telegram update. */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;

    if (!text || !chatId) return;

    // /start <verificationId>  OR  /start reset_<resetId>
    const match = text.match(/^\/start(?:\s+(.+))?$/);
    if (!match) {
      await this.sendMessage(chatId, "Salom! Ro'yxatdan o'tish yoki parol tiklash uchun Procraft saytidan link oling.");
      return;
    }

    const payload = match[1]?.trim() ?? '';

    if (payload.startsWith('reset_')) {
      await this.handlePasswordReset(chatId, payload.slice(6));
    } else if (payload) {
      await this.handleRegistration(chatId, payload);
    } else {
      await this.sendMessage(chatId, "Salom! Procraft saytidan tasdiqlash linkini bosing.");
    }
  }

  private async handleRegistration(chatId: number, verificationId: string): Promise<void> {
    const now = new Date();
    const repo = this.dataSource.getRepository(PendingRegistrationEntity);
    const pending = await repo.findOne({ where: { id: verificationId } });

    if (!pending || pending.consumedAt || pending.expiresAt <= now) {
      await this.sendMessage(chatId, "Link muddati tugagan yoki noto'g'ri. Qayta ro'yxatdan o'ting.");
      return;
    }

    const code = generateCode();
    await repo.update(
      { id: verificationId },
      {
        codeHash: this.tokenService.hashVerificationCode(verificationId, code),
        attemptCount: 0,
        updatedAt: now,
      },
    );

    await this.sendMessage(
      chatId,
      `Procraft tasdiqlash kodingiz: *${code}*\n\nKod 5 daqiqa amal qiladi.`,
    );
  }

  private async handlePasswordReset(chatId: number, resetId: string): Promise<void> {
    const now = new Date();
    const repo = this.dataSource.getRepository(PasswordResetCodeEntity);
    const reset = await repo.findOne({ where: { id: resetId } });

    if (!reset || reset.consumedAt || reset.expiresAt <= now) {
      await this.sendMessage(chatId, "Link muddati tugagan yoki noto'g'ri. Qayta parol tiklash so'rovini yuboring.");
      return;
    }

    const code = generateCode();
    await repo.update(
      { id: resetId },
      {
        codeHash: this.tokenService.hashVerificationCode(resetId, code),
        attemptCount: 0,
        updatedAt: now,
      },
    );

    await this.sendMessage(
      chatId,
      `Procraft parol tiklash kodingiz: *${code}*\n\nKod 5 daqiqa amal qiladi.`,
    );
  }

  async sendMessage(chatId: number | string, text: string): Promise<void> {
    await this.callApi('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
  }

  private async callApi(method: string, body: Record<string, unknown>): Promise<unknown> {
    const token = getConfig().telegram.botToken;
    if (!token) throw new Error('Telegram bot token not configured.');

    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { ok: boolean; description?: string };
    if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
    return data;
  }
}

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}
