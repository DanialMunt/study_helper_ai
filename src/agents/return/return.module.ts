import { Module } from '@nestjs/common';
import { ReturnsAgent } from './return.agent';
import { ReturnAgentModule } from 'src/tools/return/return.module';
import { LlmModule } from 'src/llm/llm.module';
@Module({
    imports: [ReturnAgentModule, LlmModule],
    providers: [ReturnsAgent],
    exports: [ReturnsAgent]
})
export class ReturnModule {}
