import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConversationSession } from "./entity/conversation-session.entity";

@Injectable()
export class ConversationStoreService {
  constructor(
    @InjectRepository(ConversationSession)
    private readonly repo: Repository<ConversationSession>,
  ) {}

  async get(sessionId: string): Promise<Record<string, any> | null> {
    const row = await this.repo.findOne({ where: { sessionId } });
    if (!row) return null;

    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      // expired -> delete
      await this.repo.delete({ sessionId });
      return null;
    }

    return row.context ?? null;
  }

  async set(sessionId: string, context: Record<string, any>, ttlMinutes = 30) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.repo.save({
      sessionId,
      context,
      expiresAt,
    });
  }

  async clear(sessionId: string) {
    await this.repo.delete({ sessionId });
  }

  async cleanupExpired() {
    await this.repo
      .createQueryBuilder()
      .delete()
      .from(ConversationSession)
      .where("expires_at IS NOT NULL AND expires_at < NOW()")
      .execute();
  }
}
