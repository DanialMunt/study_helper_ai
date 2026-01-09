import { Module } from '@nestjs/common';
import { OrchestratorAgent } from './orchestrator.agent';
import { BillingAgentModule } from '../agents/billing/billing.module';
import { LlmModule } from '../llm/llm.module';
import { ReturnModule } from 'src/agents/return/return.module';

@Module({
  imports: [BillingAgentModule, LlmModule, ReturnModule],
  providers: [OrchestratorAgent],
  exports: [OrchestratorAgent],
})
export class OrchestratorModule {}
