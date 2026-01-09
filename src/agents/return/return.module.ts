import { Module } from '@nestjs/common';
import { ReturnsAgent } from './return.agent';

@Module({
    providers: [ReturnsAgent],
    exports: [ReturnsAgent]
})
export class ReturnModule {}
