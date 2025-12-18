import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Module({
  imports: [OrchestratorModule],
  controllers: [ChatController],
})
export class ChatModule {}
