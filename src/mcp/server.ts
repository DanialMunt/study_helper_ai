import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EmailTool } from "../tools/email/email.tool";
import { AppModule } from "../app.module";
import { ReturnTool } from "../tools/return/return.tool";
import { BillingTool } from "../tools/billing/billing.tool";

async function main() {
  // IMPORTANT for stdio MCP servers:
  // Do NOT write logs to stdout (it breaks the protocol).
  // Use Nest logger off + console.error if needed.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const returnTool = app.get(ReturnTool);
  const billingTool = app.get(BillingTool);
const emailTool = app.get(EmailTool);
  const server = new McpServer({
    name: "customer-service-mcp",
    version: "0.1.0",
  });

  // --- RETURNS ---
  server.tool(
    "returns.check_eligibility",
    {
      invoiceId: z.number().int().positive(),
    },
    async ({ invoiceId }) => {
      const result = await returnTool.handle(invoiceId);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  // --- BILLING ---
  server.tool(
    "billing.issue_refund",
    {
      invoiceId: z.number().int().positive(),
    },
    async ({ invoiceId }) => {
      const result = await billingTool.issueRefund(invoiceId);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.tool(
    "billing.get_invoice_details",
    {
      invoiceId: z.number().int().positive(),
    },
    async ({ invoiceId }) => {
      const result = await billingTool.getInvoiceDetails(invoiceId);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.tool(
  "email.send",
  {
    to: z.string().min(3),
    subject: z.string().min(1),
    body: z.string().min(1),
   metadata: z.record(z.string(), z.any()).optional(),
  },
  async ({ to, subject, body, metadata }) => {
    const result = await emailTool.send({ to, subject, body, metadata });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);


  // Start MCP server over stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // stderr is OK
  console.error("MCP server crashed:", err);
  process.exit(1);
});
