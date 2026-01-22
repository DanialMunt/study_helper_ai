import { Injectable } from "@nestjs/common";
import * as fs from "node:fs/promises";
import * as path from "node:path";

type EmailSendInput = {
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, any>;
};

@Injectable()
export class EmailTool {
  private readonly outboxPath = path.join(process.cwd(), "outbox.jsonl");

  async send(input: EmailSendInput): Promise<{ success: boolean; id: string }> {
    const id = `email_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const record = {
      id,
      ts: new Date().toISOString(),
      ...input,
    };

    await fs.appendFile(this.outboxPath, JSON.stringify(record) + "\n", "utf8");
    return { success: true, id };
  }
}
