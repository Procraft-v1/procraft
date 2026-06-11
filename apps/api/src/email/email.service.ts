import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getConfig } from '../config/env';

/**
 * Port of Procraft.Infrastructure.Email.SmtpEmailService, including the stub
 * behavior: without a host (or with a username but no password) the message is
 * logged instead of sent, and startup never depends on SMTP availability.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    const smtp = getConfig().smtp;

    if (this.shouldUseStub()) {
      this.logger.warn(
        `Email stub is active: no real email was sent. To=${to}, Subject=${subject}, Body=${body}. Configure complete SMTP settings before production email delivery.`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      // System.Net.Mail's EnableSsl means STARTTLS upgrade on 587, implicit TLS on 465.
      secure: smtp.port === 465,
      requireTLS: smtp.enableSsl && smtp.port !== 465,
      auth:
        smtp.username && smtp.username.trim() !== ''
          ? { user: smtp.username, pass: smtp.password }
          : undefined,
    });

    await transporter.sendMail({
      from: { name: smtp.fromName, address: smtp.fromAddress },
      to,
      subject,
      text: body,
    });

    this.logger.log(`Email sent. To=${to}, Subject=${subject}.`);
  }

  private shouldUseStub(): boolean {
    const smtp = getConfig().smtp;

    if (!smtp.host || smtp.host.trim() === '') {
      return true;
    }

    return smtp.username.trim() !== '' && smtp.password.trim() === '';
  }
}
