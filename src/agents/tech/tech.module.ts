import { Module } from '@nestjs/common';
import { TechSupportAgent } from './tech.agent';
import { LlmModule } from 'src/llm/llm.module';
import { McpClientModule } from 'src/mcp/mcp-client.module';
@Module({
    imports: [ LlmModule, McpClientModule],
    providers: [TechSupportAgent],
    exports: [TechSupportAgent]
})
export class TechSupportModule {}
