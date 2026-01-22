import { Module } from '@nestjs/common';
import { EmailTool } from './email.tool';

@Module({
  providers: [EmailTool],
  exports: [EmailTool],
})
export class EmailModule {}
