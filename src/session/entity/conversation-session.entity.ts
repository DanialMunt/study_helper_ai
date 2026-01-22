import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "conversation_sessions" })
export class ConversationSession {
  @PrimaryColumn({ type: "text", name: "session_id" })
  sessionId!: string;

  @Column({ type: "jsonb" })
  context!: Record<string, any>;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "timestamptz", name: "expires_at", nullable: true })
  expiresAt!: Date | null;
}
