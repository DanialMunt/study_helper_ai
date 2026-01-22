import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "conversation_sessions" })
export class ConversationSession {
  @PrimaryGeneratedColumn("uuid", { name: "session_id" })
  sessionId!: string;

  @Column({ type: "jsonb" })
  context!: Record<string, any>;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "timestamptz", name: "expires_at", nullable: true })
  expiresAt!: Date | null;
}
