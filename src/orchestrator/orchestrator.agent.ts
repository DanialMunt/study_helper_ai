import {
  Injectable
} from '@nestjs/common';
import {
  LlmService
} from 'src/llm/llm.service';
import {
  BillingAgent
} from '../agents/billing/billing.agent';
import { ConversationContext, OrchestratorPlan } from './orchestrator.types';
import { orchestratorPrompt } from './orchestrator.prompt';
import { extractJson } from 'src/utils/extractJson';
import { ReturnsAgent } from 'src/agents/return/return.agent';

@Injectable()
export class OrchestratorAgent {
  private context: ConversationContext | null = null
  constructor(
    private readonly llm: LlmService,
    private readonly billingAgent: BillingAgent,
    private readonly returnsAgent: ReturnsAgent
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

    console.log("Plan: ", plan)

    if (!plan || !plan.plan || plan.plan.length === 0) {
    return 'Entschuldigung Bruder, aber du hast unsupported request';
  }

    const step = plan.plan[0];
    if (step.agent === 'billing') {
      return this.billingAgent.handle(step);
    }

    if (step.agent === 'returns') {
      return this.returnsAgent.handle(step.action, step.input);
    }

    return 'Entschuldigung Bruder, aber du hast unsupported request';
  }
}