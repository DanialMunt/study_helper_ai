import { Module } from '@nestjs/common';
import { ReturnsAgent } from './return.agent';
import { ReturnToolModule } from 'src/tools/return/return.module';
import { LlmModule } from 'src/llm/llm.module';
import { McpClientModule } from 'src/mcp/mcp-client.module';
@Module({
    imports: [ReturnToolModule, LlmModule, McpClientModule],
    providers: [ReturnsAgent],
    exports: [ReturnsAgent]
})
export class ReturnAgentModule {}
