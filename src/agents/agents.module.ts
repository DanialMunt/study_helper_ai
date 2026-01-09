import { Module } from '@nestjs/common';
import { ReturnModule } from './return/return.module';

@Module({
  imports: [ReturnModule]
})
export class AgentsModule {}
