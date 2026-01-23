import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as nodemailer from 'nodemailer';

type EmailSendInput = {
  to: string;
  subject: string;
  body: string;
  metadata?: {
    invoiceId?: number;
    description?: string;
    amount?: number;
    type?: string;
    [key: string]: any;
  };
};

@Injectable()
export class EmailTool {
  private readonly logger = new Logger(EmailTool.name);
  private readonly outboxPath = path.join(process.cwd(), 'outbox.jsonl');
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const secureFlag =
      (this.config.get<string>('EMAIL_SECURE') ?? 'false').toLowerCase() ===
      'true';

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('EMAIL_HOST'),
      port: Number(this.config.get<number>('EMAIL_PORT') ?? 587),
      secure: secureFlag,
      auth: {
        user: this.config.get<string>('EMAIL_USER'),
        pass: this.config.get<string>('EMAIL_PASS'),
      },
    });
  }

  async send(input: EmailSendInput) {
    const id = `email_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await fs.appendFile(
      this.outboxPath,
      JSON.stringify({ id, ts: new Date().toISOString(), ...input }) + '\n',
      'utf8',
    );

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('EMAIL_USER'),
        to: input.to,
        subject: input.subject,
        text: input.body,
      });

      this.logger.log(`Email sent successfully: ${id}`);
      return { success: true, id };
    } catch (err) {
      this.logger.error(`Email sending failed: ${err}`);
      return { success: false, id };
    }
  }
}
