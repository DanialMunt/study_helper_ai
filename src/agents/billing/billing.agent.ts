import { Injectable } from '@nestjs/common';
import { Agent } from '../agent.interface';
import { BillingTool } from 'src/tools/billing/billing.tool';

@Injectable()
export class BillingAgent implements Agent {
  name = 'billing';

  constructor(private readonly billingTool: BillingTool) {}

  async handle(_: any): Promise<string> {
    const result = await this.billingTool.execute({ userId: 2 });

    return `Your total outstanding balance is €${result.total}`;
  }
}
