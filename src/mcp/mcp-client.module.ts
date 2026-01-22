import { Module } from "@nestjs/common";
import { McpClientService } from "./client";

@Module({
  providers: [McpClientService],
  exports: [McpClientService],
})
export class McpClientModule {}
