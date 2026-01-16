import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from 'src/invoice/entity/invoice.entity';
import { ReturnTool } from './return.tool';
import { ReturnRepository } from './return.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Invoice])],
      providers: [ReturnTool, ReturnRepository],
      exports: [ReturnTool],
})
export class ReturnAgentModule {
    
}
