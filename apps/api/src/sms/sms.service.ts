import { Injectable, Logger } from '@nestjs/common';
import { getConfig } from '../config/env';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private tokenCache: { token: string; expiresAt: Date } | null = null;

  async send(phoneNumber: string, message: string): Promise<void> {
    const config = getConfig().eskiz;

    if (!config.email || !config.password) {
      this.logger.warn(
        `SMS stub active: no real SMS sent. To=${phoneNumber}, Message=${message}. Configure Eskiz__Email and Eskiz__Password.`,
      );
      return;
    }

    const token = await this.getToken();
    const digits = phoneNumber.replace(/\D/g, '');

    const response = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile_phone: digits,
        message,
        from: config.sender,
        callback_url: '',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Eskiz SMS failed: ${response.status} ${text}`);
      throw new Error('SMS yuborishda xatolik yuz berdi.');
    }

    this.logger.log(`SMS sent to ${phoneNumber}`);
  }

  private async getToken(): Promise<string> {
    const now = new Date();

    if (this.tokenCache && this.tokenCache.expiresAt > now) {
      return this.tokenCache.token;
    }

    const config = getConfig().eskiz;
    const form = new FormData();
    form.append('email', config.email);
    form.append('password', config.password);

    const response = await fetch('https://notify.eskiz.uz/api/auth/login', {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Eskiz auth failed: ${response.status}`);
    }

    const data = (await response.json()) as { data: { token: string } };
    const token = data.data.token;

    // Token expires in 30 days; cache for 29 to stay ahead of expiry
    this.tokenCache = {
      token,
      expiresAt: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
    };

    return token;
  }
}
