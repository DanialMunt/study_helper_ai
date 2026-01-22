import { Module } from '@nestjs/common';
import { KbTool } from './kb.tool';

@Module({

  providers: [KbTool],
  exports: [KbTool],
})
export class KbToolModule {}
