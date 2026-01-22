import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { OcrModule } from 'src/ocr/ocr.module';

@Module({
  imports: [OrchestratorModule, OcrModule],
  controllers: [ChatController],
})
export class ChatModule {}
