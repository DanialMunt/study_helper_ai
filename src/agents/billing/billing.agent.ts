import { Injectable } from '@nestjs/common';
import { Agent } from '../agent.interface';
import { BillingTool } from 'src/tools/billing/billing.tool';

@Injectable()
export class BillingAgent implements Agent {
  name = 'billing';

  constructor(private readonly billingTool: BillingTool) {}

  async handle(plan: { action: string; input: any }): Promise<string> {
    switch (plan.action) {
      case 'get_total_balance': {
        const result = await this.billingTool.execute({ userId: 1 });
        return `Your total outstanding balance is €${result.total}`;
      }

      default:
        throw new Error(`Unknown billing action: ${plan.action}`);
    }
  }
}

