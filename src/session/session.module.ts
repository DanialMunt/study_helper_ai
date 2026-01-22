import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConversationSession } from "./entity/conversation-session.entity";
import { ConversationStoreService } from "./conversation-store.service";

@Module({
  imports: [TypeOrmModule.forFeature([ConversationSession])],
  providers: [ConversationStoreService],
  exports: [ConversationStoreService],
})
export class SessionModule {}
