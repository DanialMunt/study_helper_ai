import { Controller, Post, Body } from '@nestjs/common';
import { OrchestratorAgent } from '../orchestrator/orchestrator.agent';

@Controller('chat')
export class ChatController {
  constructor(private readonly orchestrator: OrchestratorAgent) {}

  @Post()
  async chat( @Body("sessionId") sessionId: string,
  @Body("message") message: string,) {
    const reply = await this.orchestrator.handle(message);
    return { reply };
  }
}
