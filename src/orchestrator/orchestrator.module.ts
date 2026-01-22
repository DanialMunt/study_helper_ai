import { Module } from '@nestjs/common';
import { OrchestratorAgent } from './orchestrator.agent';
import { BillingAgentModule } from '../agents/billing/billing.module';
import { LlmModule } from 'src/llm/llm.module';
import { ReturnAgentModule } from 'src/agents/return/return.module';
import { McpClientModule } from 'src/mcp/mcp-client.module';
import { TechSupportModule } from 'src/agents/tech/tech.module';
import { SessionModule } from 'src/session/session.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Invoice } from 'src/invoice/entity/invoice.entity';

@Module({
  imports: [
    BillingAgentModule,
    LlmModule,
    ReturnAgentModule,
    McpClientModule,
    TechSupportModule,
    SessionModule,
    TypeOrmModule.forFeature([User, Invoice]),
  ],
  providers: [OrchestratorAgent],
  exports: [OrchestratorAgent],
})
export class OrchestratorModule {}
