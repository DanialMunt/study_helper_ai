import {
  Injectable
} from '@nestjs/common';
import {
  LlmService
} from 'src/llm/llm.service';
import {
  BillingAgent
} from '../agents/billing/billing.agent';
import { OrchestratorPlan } from './orchestrator.types';
import { orchestratorPrompt } from './orchestrator.prompt';
import { extractJson } from 'src/utils/extractJson';

@Injectable()
export class OrchestratorAgent {
  constructor(
    private readonly llm: LlmService,
    private readonly billingAgent: BillingAgent,
  ) { }

  async handle(message: string): Promise<string> {
    const raw = await this.llm.generate(orchestratorPrompt(message));
    let plan: OrchestratorPlan

    try {
      plan = extractJson(raw);
    } catch (e) {
      console.error('Invalid LLM output:', raw);
      return 'Sorry, something went wrong.';
    }

    console.log("Plan: ", plan, plan.plan)

    if (!plan || !plan.plan) {
    return 'Entschuldigung Bruder, aber du hast unsupported request';
  }


    if (plan.plan.agent === 'billing') {
      return this.billingAgent.handle(plan.plan);
    }

    return 'Entschuldigung Bruder, aber du hast unsupported request';
  }
}