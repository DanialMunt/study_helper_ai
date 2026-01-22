import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from 'src/invoice/entity/invoice.entity';
import { ReturnTool } from './return.tool';
// import { ReturnRepository } from './return.repository';
import { ReturnRepository } from "src/tools/return/return.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Invoice])],
      providers: [ReturnTool, ReturnRepository],
      exports: [ReturnTool, ReturnRepository],
})
export class ReturnToolModule {}
