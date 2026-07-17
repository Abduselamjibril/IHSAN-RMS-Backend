import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress = 'no-reply@ihsanproperties.com';

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAILER_HOST') || this.configService.get<string>('SMTP_HOST');
    const portStr = this.configService.get<string>('MAILER_PORT') || this.configService.get<string>('SMTP_PORT');
    const port = portStr ? parseInt(portStr, 10) : null;
    const user = this.configService.get<string>('MAILER_USER') || this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('MAILER_PASS') || this.configService.get<string>('SMTP_PASS');
    const secureVal = this.configService.get<string>('MAILER_SECURE') || this.configService.get<string>('SMTP_SECURE');
    const secure = secureVal === 'true' || (port === 465 && secureVal !== 'false');
    const from = this.configService.get<string>('MAILER_FROM') || this.configService.get<string>('SMTP_FROM');

    if (from) {
      this.fromAddress = from;
    }

    if (host && port) {
      try {
        const transportConfig: any = {
          host,
          port,
          secure,
          pool: true,
          maxConnections: 3,
          maxMessages: 100,
        };

        if (user && pass) {
          transportConfig.auth = { user, pass };
        }

        this.transporter = nodemailer.createTransport(transportConfig);
        this.logger.log(`SMTP Email Transport initialized (host: ${host}:${port}, secure: ${secure})`);
      } catch (error) {
        this.logger.error(`Failed to initialize SMTP transporter: ${error.message}`);
      }
    } else {
      this.logger.warn(
        `MAILER_HOST or MAILER_PORT not configured. Falling back to Console Logger Email Service.`,
      );
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    if (!to) {
      this.logger.warn(`Cannot send email: recipient address is empty.`);
      return false;
    }

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          text,
          html: html || text,
        });
        this.logger.log(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        this.printEmailToConsole(to, subject, text);
        return false;
      }
    } else {
      this.printEmailToConsole(to, subject, text);
      return true;
    }
  }

  private printEmailToConsole(to: string, subject: string, text: string) {
    console.log(`
==================== [EMAIL PREVIEW] ====================
From:    ${this.fromAddress}
To:      ${to}
Subject: ${subject}
Date:    ${new Date().toISOString()}
---------------------------------------------------------
${text}
=========================================================
`);
  }
}
// Force watch restart trigger
