import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type McpToolCallResult = {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

@Injectable()
export class McpClientService implements OnModuleDestroy {
  private client: Client | null = null;
  private connected = false;

  // Keep one connection for the whole app
  private async ensureConnected() {
    if (this.connected && this.client) return;

    // DEV: run MCP server via tsx
    // PROD: switch to `node dist/mcp/server.js`
    const command = "node";
    const args = ["dist/mcp/server.js"];

    this.client = new Client({
      name: "study-helper-api",
      version: "0.1.0",
    });

    const transport = new StdioClientTransport({ command, args });

    await this.client.connect(transport);
    this.connected = true;
  }

  async callTool<TInput extends Record<string, unknown>, TOutput = any>(
    toolName: string,
    input: TInput,
  ): Promise<TOutput> {
    await this.ensureConnected();
    if (!this.client) throw new Error("MCP client not initialized");

    const res = (await this.client.callTool({
      name: toolName,
      arguments: input,
    })) as McpToolCallResult;

    if (res?.isError) {
      throw new Error(`MCP tool error calling ${toolName}`);
    }

    const text = res?.content?.find((c) => c.type === "text")?.text ?? "{}";
    try {
      return JSON.parse(text) as TOutput;
    } catch {
      // If your tool returns plain text, handle it here
      return text as unknown as TOutput;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client?.close();
    } catch {
      // ignore
    }
    this.connected = false;
    this.client = null;
  }
}
