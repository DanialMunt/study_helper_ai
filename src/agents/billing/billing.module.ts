import { Module } from '@nestjs/common';
import { BillingAgent } from './billing.agent';
import { BillingModule } from '../../tools/billing/billing.module';

@Module({
  imports: [BillingModule],
  providers: [BillingAgent],
  exports: [BillingAgent],
})
export class BillingAgentModule {}
