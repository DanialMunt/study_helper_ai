import { Module } from '@nestjs/common';
import { ReturnAgentModule } from './return/return.module';

@Module({
  imports: [ReturnAgentModule]
})
export class AgentsModule {}
