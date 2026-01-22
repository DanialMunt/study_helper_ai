import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailTool } from './email.tool';

@Module({
  imports: [ConfigModule],
  providers: [EmailTool],
  exports: [EmailTool],
})
export class EmailModule {}
