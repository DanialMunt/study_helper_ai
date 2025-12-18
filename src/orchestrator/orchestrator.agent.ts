import { Injectable } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { BillingAgent } from '../agents/billing/billing.agent';

@Injectable()
export class OrchestratorAgent {
  constructor(
    private readonly llm: LlmService,
    private readonly billingAgent: BillingAgent,
  ) {}

  async handle(message: string): Promise<string> {
    const planRaw = await this.llm.generate(`
You are an intent classifier.
Return ONLY JSON, no markdown, no explanation.

User message: "${message}"

Schema:
{
  "agent": "billing" | "unknown"
}
`);

    const plan = JSON.parse(planRaw);

    if (plan.agent === 'billing') {
      return this.billingAgent.handle(plan);
    }

    return 'Sorry, I cannot handle this request.';
  }
}
