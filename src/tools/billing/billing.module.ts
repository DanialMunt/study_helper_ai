import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from 'src/invoice/entity/invoice.entity';
import { BillingRepository } from './billing.repository';
import { BillingTool } from './billing.tool';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  providers: [BillingRepository, BillingTool],
  exports: [BillingTool],
})
export class BillingToolModule {}
