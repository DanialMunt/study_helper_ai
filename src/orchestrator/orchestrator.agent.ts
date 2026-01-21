import { Injectable } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { BillingAgent } from '../agents/billing/billing.agent';
import { ConversationContext, OrchestratorPlan } from './orchestrator.types';
import { orchestratorPrompt } from './orchestrator.prompt';
import { extractJson } from 'src/utils/extractJson';
import { ReturnsAgent } from 'src/agents/return/return.agent';
import { returnsAgentPrompt } from 'src/agents/return/returnsAgent.prompt';
import { billingAgentPrompt } from 'src/agents/billing/billingAgent.prompt';
@Injectable()
export class OrchestratorAgent {
  private context: ConversationContext | null = null;

  constructor(
    private readonly llm: LlmService,
    private readonly billingAgent: BillingAgent,
    private readonly returnsAgent: ReturnsAgent,
  ) {}

  async handle(message: string): Promise<string> {
    if (this.context?.awaitingSlot) {
      const slot = this.context.awaitingSlot;

      if (slot === 'orderId') {
        const num = Number(message);
        if (Number.isNaN(num)) {
          return 'Order ID must be a number. Please provide a valid orderId.';
        }
        this.context.slots.orderId = num;
        console.log(`Slot filled: orderId = ${num}`);
      } else {
        this.context.slots[slot] = message;
        console.log(`Slot filled: ${slot} = ${message}`);
      }

      this.context.awaitingSlot = undefined;
    }

    if (!this.context) {
      const raw = await this.llm.generate(orchestratorPrompt(message));
      let planJson: OrchestratorPlan;

      try {
        planJson = extractJson(raw);
      } catch (e) {
        console.error('Invalid LLM output:', raw);
        return 'Sorry, something went wrong.';
      }

      if (!planJson || !planJson.plan || planJson.plan.length === 0) {
        return 'Sorry, your request is unsupported.';
      }

      this.context = {
        intent: planJson.intent,
        plan: planJson.plan,
        currentStep: 0,
        slots: {},
        awaitingSlot: undefined,
      };

      console.log('Initial plan:', this.context.plan);
    }

    const stepResults: string[] = [];

    while (this.context.currentStep < this.context.plan.length) {
      const step = this.context.plan[this.context.currentStep];
      console.log('Current step:', step);

      for (const slot of step.requiredSlots ?? []) {
        if (!this.context.slots[slot]) {
          this.context.awaitingSlot = slot;
          return `Please provide ${slot}.`;
        }
      }
      step.input = {
        ...step.input,
        ...this.context.slots,
      };

      const input = { ...step.input };

      if (step.agent === 'returns') {
        const returnsResult = await this.returnsAgent.handleWithPrompt({
          orderId: input.orderId,
          context: this.context,
        });

        console.log('ReturnsAgent result:', returnsResult);

        if (returnsResult.decision !== 'approved') {
          this.context = null;
          return (
            returnsResult.message || 'This order is not eligible for return.'
          );
        }

        stepResults.push(returnsResult.message);
      } else if (step.agent === 'billing') {
        if (!step.input.orderId) {
          return 'Cannot proceed: missing orderId.';
        }

        const billingResult = await this.billingAgent.handleWithPrompt({
          orderId: input.orderId,
          decision: 'approved',
          context: this.context,
        });

        console.log('BillingAgent result:', billingResult);

        if (billingResult.status !== 'success') {
          this.context = null;
          return billingResult.message || 'Refund failed.';
        }

        stepResults.push(billingResult.message);
      } else {
        return 'Unsupported agent.';
      }

      this.context.currentStep++;
    }

    this.context = null;
    return stepResults.join(', ');
  }
}
