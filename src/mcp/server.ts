import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EmailTool } from "../tools/email/email.tool";

import { ReturnTool } from "../tools/return/return.tool";
import { BillingTool } from "../tools/billing/billing.tool";
import { KbTool } from "src/tools/kb/kb.tool";
import { McpModule } from "./mcp.module";


async function main() {

  const app = await NestFactory.createApplicationContext(McpModule, {
    // logger: ["error", "warn"],
    logger: false,
  });




  const returnTool = app.get(ReturnTool);
  const billingTool = app.get(BillingTool);
  const emailTool = app.get(EmailTool);
  const kbTool = app.get(KbTool)


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

  server.tool(
    "email.send_refund_confirmation",
    {
      email: z.string().email(),
      invoiceId: z.number().int().positive(),
    },
    async ({ email, invoiceId }) => {
      const subject = `Refund confirmation for invoice #${invoiceId}`;
      const body = `We have initiated your refund for invoice #${invoiceId}. If you have questions, reply to this email.`;

      const result = await emailTool.send({
        to: email,
        subject,
        body,
        metadata: { invoiceId, type: "refund_confirmation" },
      });

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  );

  server.tool(
    "kb.search",
    {
      query: z.string().min(2),
      limit: z.number().int().min(1).max(5).optional(),
    },
    async ({ query, limit }) => {
      const result = await kbTool.search(query, limit ?? 3);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
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
