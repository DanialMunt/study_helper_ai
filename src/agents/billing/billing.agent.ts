import { Injectable } from '@nestjs/common';
import { BillingTool } from 'src/tools/billing/billing.tool';
import { LlmService } from 'src/llm/llm.service';
import { billingAgentPrompt } from './billingAgent.prompt';
import { extractJson } from 'src/utils/extractJson';

@Injectable()
export class BillingAgent {
  constructor(
    private readonly billingTool: BillingTool,
    private readonly llm: LlmService
  ) {}


  async handle(plan: { action: string; input: any }): Promise<string> {
    switch (plan.action) {
      case 'issue_refund':
        await this.billingTool.issueRefund(plan.input.orderId);
        return `Refund has been issued for order ${plan.input.orderId}`;
      default:
        throw new Error(`Unknown billing action: ${plan.action}`);
    }
  }


 async handleWithPrompt(input: {
  orderId: number;
  decision: "approved" | "rejected" ;
  context?: any;
}) {
  const { orderId, decision , context = {} } = input;


  const prompt = billingAgentPrompt(orderId, decision , context);


  const raw = await this.llm.generate(prompt);
  console.log("Billing Agent's response: ", raw)

  let result: any;
  try {
    result = extractJson(raw);
  } catch (e) {
    console.error('Invalid LLM output for BillingAgent:', raw);
    return {
      status: 'failed',
      transactionId: null,
      message: 'Cannot process refund.'
    };
  }

 
  if (result.status !== 'success') {
    return {
      status: 'failed',
      transactionId: null,
      message: result.message || 'Refund not approved.'
    };
  }

 
  await this.billingTool.issueRefund(orderId);

  return {
    status: 'success',
    transactionId: result.transactionId ?? null,
    message: result.message ?? `Refund has been issued for order ${orderId}.`
  };
}

}
