import { Module } from '@nestjs/common';
import { BillingAgent } from './billing.agent';
import { BillingModule } from '../../tools/billing/billing.module';
import { LlmModule } from 'src/llm/llm.module';
@Module({
  imports: [BillingModule, LlmModule],
  providers: [BillingAgent],
  exports: [BillingAgent],
})
export class BillingAgentModule {}
