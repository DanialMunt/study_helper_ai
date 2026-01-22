import { Module } from '@nestjs/common';
import { BillingAgent } from './billing.agent';
import { BillingToolModule } from '../../tools/billing/billing.module';
import { LlmModule } from 'src/llm/llm.module';
import { McpClientModule } from 'src/mcp/mcp-client.module';
@Module({
  imports: [BillingToolModule, LlmModule, McpClientModule],
  providers: [BillingAgent],
  exports: [BillingAgent],
})
export class BillingAgentModule {}
