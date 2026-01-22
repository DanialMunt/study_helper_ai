import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as nodemailer from "nodemailer";

type EmailSendInput = {
  to: string;
  subject?: string;
  body?: string;
  metadata?: {
    invoiceId?: number;
    description?: string;
    amount?: number;
    type?: string;
  };
};

@Injectable()
export class EmailTool {
  private readonly logger = new Logger(EmailTool.name);
  private readonly outboxPath = path.join(process.cwd(), "outbox.jsonl");
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const secureFlag =
      (this.config.get<string>("EMAIL_SECURE") ?? "false").toLowerCase() === "true";

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>("EMAIL_HOST"),
      port: Number(this.config.get<number>("EMAIL_PORT") ?? 587),
      secure: secureFlag,
      auth: {
        user: this.config.get<string>("EMAIL_USER"),
        pass: this.config.get<string>("EMAIL_PASS"),
      },
    });
  }

  async send(input: EmailSendInput): Promise<{ success: boolean; id: string }> {
    const id = `email_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const record = {
      id,
      ts: new Date().toISOString(),
      ...input,
    };

    await fs.appendFile(this.outboxPath, JSON.stringify(record) + "\n", "utf8");

    const desc = input.metadata?.description ?? "Your item";
    const amt = input.metadata?.amount ?? "N/A";
    const inv = input.metadata?.invoiceId ?? "N/A";

    const subject = input.subject ?? `Refund Confirmation for Invoice #${inv}`;

    const textBody = 
`Hello,

Your refund has been successfully processed.

Invoice: #${inv}
Item: ${desc}
Amount: €${amt}

If you have any questions, feel free to contact support.

Best regards,
Store Support Team`;

    const htmlBody = `
      <div style="font-family: Arial; font-size: 15px;">
        <p>Hello,</p>
        <p>Your refund has been <strong>successfully processed</strong>.</p>

        <h3>Refund Details</h3>
        <ul>
          <li><strong>Invoice ID:</strong> ${inv}</li>
          <li><strong>Item:</strong> ${desc}</li>
          <li><strong>Amount:</strong> €${amt}</li>
        </ul>

        <p>If you have any questions, feel free to contact support.</p>

        <p>Best regards,<br />Store Support Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>("EMAIL_USER"),
        to: input.to,
        subject,
        text: textBody,
        html: htmlBody,
      });

      this.logger.log(`Email sent successfully: ${id}`);
      return { success: true, id };
    } catch (err) {
      this.logger.error(`Email sending failed: ${err}`);
      return { success: false, id };
    }
  }
}
