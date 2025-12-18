import { Module } from '@nestjs/common';
import { OrchestratorAgent } from './orchestrator.agent';
import { BillingAgentModule } from '../agents/billing/billing.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [BillingAgentModule, LlmModule],
  providers: [OrchestratorAgent],
  exports: [OrchestratorAgent],
})
export class OrchestratorModule {}
