import { Injectable } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { McpTool } from '../../mcp/mcp-tool.interface';

@Injectable()
export class BillingTool
  implements McpTool<{ userId: number }, { total: number }>
{
  name = 'billing_tool';

  constructor(private readonly repo: BillingRepository) {}

  async execute(input: { userId: number }) {
    console.log('[MCP] BillingTool called', input);

    const invoices = await this.repo.findByUser(input.userId);

    const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

    return { total };
  }
}
