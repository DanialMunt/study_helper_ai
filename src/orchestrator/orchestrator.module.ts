import { Module } from '@nestjs/common';
import { OrchestratorAgent } from './orchestrator.agent';
import { BillingAgentModule } from '../agents/billing/billing.module';
import { LlmModule } from '../llm/llm.module';
import { ReturnAgentModule } from 'src/agents/return/return.module';
import { McpClientModule } from 'src/mcp/mcp-client.module';
import { TechSupportModule } from 'src/agents/tech/tech.module';
@Module({
  imports: [BillingAgentModule, LlmModule, ReturnAgentModule, McpClientModule, TechSupportModule],
  providers: [OrchestratorAgent],
  exports: [OrchestratorAgent],
})
export class OrchestratorModule {}
