import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomInt } from 'crypto';
import { PendingRegistrationEntity, PasswordResetCodeEntity } from '../database/entities';
import { TokenService } from '../auth/token.service';
import { getConfig } from '../config/env';

const CODE_LENGTH = 4;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Channel {
  username: string;
  url: string;
  label: string;
}

/** Bot must be admin in both channels for getChatMember to work. */
const CHANNELS: Channel[] = [
  { username: '@ProcraftUz', url: 'https://t.me/ProcraftUz', label: "📢 Procraft kanaliga obuna bo'lish" },
  { username: '@RaximjonTulaganov', url: 'https://t.me/RaximjonTulaganov', label: "📢 Raximjon kanaliga obuna bo'lish" },
];

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
      const webhookSecret = getConfig().telegram.webhookSecret;
      const webhookPayload: Record<string, unknown> = { url: webhookUrl };
      if (webhookSecret) {
        webhookPayload.secret_token = webhookSecret;
      }
      await this.callApi('setWebhook', webhookPayload);
      this.logger.log(`Telegram webhook registered: ${webhookUrl}`);
    } catch (err) {
      this.logger.error('Failed to register Telegram webhook', err);
    }

    try {
      await this.callApi('setMyDescription', {
        description: "Procraft — professional portfolio va resume yaratish platformasi.\n\nRo'yxatdan o'tish yoki parol tiklash uchun procraft.uz dan link oling.",
      });
      await this.callApi('setMyShortDescription', {
        short_description: 'Procraft tasdiqlash kodi boti',
      });
    } catch {
      // Bot description setup is non-critical
    }
  }

  /** Called by the webhook controller for every incoming Telegram update. */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    // "✅ Obuna bo'ldim" button press — carries the original verification id in
    // callback_data, so the user never loses their request by pressing /start again.
    if (update.callback_query) {
      await this.handleSubscriptionCheck(update.callback_query);
      return;
    }

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
      await this.sendWelcome(chatId);
    }
  }

  private async sendWelcome(chatId: number): Promise<void> {
    const caption =
      "Procraft botiga xush kelibsiz! 👋\n\n" +
      "Procraft — professional portfolio va resume yaratish platformasi.\n\n" +
      "Ro'yxatdan o'tish yoki parol tiklash uchun procraft.uz saytidan maxsus link oling va uni bosing.";

    try {
      await this.callApi('sendPhoto', {
        chat_id: chatId,
        photo: 'https://procraft.uz/brand/procraft-app-icon-rounded.png',
        caption,
      });
    } catch (err) {
      this.logger.error(`Failed to send welcome photo to chat ${chatId}`, err);
      try {
        await this.sendMessage(chatId, caption);
      } catch {
        // Both photo and text failed; nothing more to do.
      }
    }
  }

  private async checkChannelMembership(userId: number): Promise<{ subscribed: boolean; missing: Channel[] }> {
    const missing: Channel[] = [];

    for (const channel of CHANNELS) {
      try {
        const res = (await this.callApi('getChatMember', {
          chat_id: channel.username,
          user_id: userId,
        })) as { result?: { status: string } };
        const status = res.result?.status;
        if (!status || status === 'left' || status === 'kicked') {
          missing.push(channel);
        }
      } catch {
        missing.push(channel);
      }
    }

    return { subscribed: missing.length === 0, missing };
  }

  /**
   * Subscribe prompt: a URL button per still-missing channel plus a single
   * "✅ Obuna bo'ldim" button whose callback_data carries the request id, so
   * pressing it re-checks membership and — once both channels are confirmed —
   * delivers the code for the original request.
   */
  private subscribePrompt(kind: 'reg' | 'rst', id: string, missing: Channel[]): { text: string; reply_markup: unknown } {
    const rows: unknown[] = missing.map((channel) => [{ text: channel.label, url: channel.url }]);
    rows.push([{ text: "✅ Obuna bo'ldim", callback_data: `chk:${kind}:${id}` }]);

    return {
      text:
        "Tasdiqlash kodini olish uchun quyidagi kanal(lar)ga obuna bo'ling, " +
        "so'ng «✅ Obuna bo'ldim» tugmasini bosing:",
      reply_markup: { inline_keyboard: rows },
    };
  }

  private async handleSubscriptionCheck(callback: TelegramCallbackQuery): Promise<void> {
    const chatId = callback.message?.chat?.id;
    const messageId = callback.message?.message_id;
    const match = callback.data?.match(/^chk:(reg|rst):(.+)$/);

    if (!chatId || !messageId || !match) {
      await this.answerCallback(callback.id);
      return;
    }

    const kind = match[1] as 'reg' | 'rst';
    const id = match[2];

    const membership = await this.checkChannelMembership(chatId);

    // Still missing at least one channel — re-render the prompt with only the
    // channels that remain, keeping the same check button (same logic repeats).
    if (!membership.subscribed) {
      await this.answerCallback(callback.id, "Hali barcha kanallarga obuna bo'lmadingiz.");
      const prompt = this.subscribePrompt(kind, id, membership.missing);
      try {
        await this.callApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: prompt.text,
          reply_markup: prompt.reply_markup,
        });
      } catch {
        // "message is not modified" when nothing changed — safe to ignore.
      }
      return;
    }

    // Both channels confirmed — drop the keyboard and auto-send the code for the
    // original request the user started with.
    await this.answerCallback(callback.id, 'Obuna tasdiqlandi ✅');
    try {
      await this.callApi('editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      });
    } catch {
      // Keyboard removal is best-effort.
    }

    if (kind === 'reg') {
      await this.sendRegistrationCode(chatId, id);
    } else {
      await this.sendPasswordResetCode(chatId, id);
    }
  }

  private async handleRegistration(chatId: number, verificationId: string): Promise<void> {
    if (!UUID_RE.test(verificationId)) {
      await this.sendMessage(chatId, "Noto'g'ri link. Procraft saytidan qayta ro'yxatdan o'ting.");
      return;
    }

    const membership = await this.checkChannelMembership(chatId);
    if (!membership.subscribed) {
      const prompt = this.subscribePrompt('reg', verificationId, membership.missing);
      await this.sendWithMarkup(chatId, prompt.text, prompt.reply_markup);
      return;
    }

    await this.sendRegistrationCode(chatId, verificationId);
  }

  private async sendRegistrationCode(chatId: number, verificationId: string): Promise<void> {
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

    try {
      await this.sendMessage(
        chatId,
        `Procraft tasdiqlash kodingiz: *${code}*\n\nKod 5 daqiqa amal qiladi.`,
      );
    } catch (err) {
      this.logger.error(`Failed to send Telegram message to chat ${chatId}`, err);
    }
  }

  private async handlePasswordReset(chatId: number, resetId: string): Promise<void> {
    if (!UUID_RE.test(resetId)) {
      await this.sendMessage(chatId, "Noto'g'ri link. Procraft saytidan qayta parol tiklash so'rovini yuboring.");
      return;
    }

    const membership = await this.checkChannelMembership(chatId);
    if (!membership.subscribed) {
      const prompt = this.subscribePrompt('rst', resetId, membership.missing);
      await this.sendWithMarkup(chatId, prompt.text, prompt.reply_markup);
      return;
    }

    await this.sendPasswordResetCode(chatId, resetId);
  }

  private async sendPasswordResetCode(chatId: number, resetId: string): Promise<void> {
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

    try {
      await this.sendMessage(
        chatId,
        `Procraft parol tiklash kodingiz: *${code}*\n\nKod 5 daqiqa amal qiladi.`,
      );
    } catch (err) {
      this.logger.error(`Failed to send Telegram message to chat ${chatId}`, err);
    }
  }

  async sendMessage(chatId: number | string, text: string): Promise<void> {
    await this.callApi('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
  }

  private async sendWithMarkup(chatId: number, text: string, replyMarkup: unknown): Promise<void> {
    await this.callApi('sendMessage', { chat_id: chatId, text, reply_markup: replyMarkup });
  }

  private async answerCallback(callbackQueryId: string, text?: string): Promise<void> {
    try {
      await this.callApi('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
    } catch {
      // Best-effort: an unanswered callback just leaves the button spinner briefly.
    }
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
  callback_query?: TelegramCallbackQuery;
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: {
    chat: { id: number };
    message_id: number;
  };
}
