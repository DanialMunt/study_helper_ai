import { Injectable } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { BillingAgent } from '../agents/billing/billing.agent';
import { ConversationContext, OrchestratorPlan } from './orchestrator.types';
import { orchestratorPrompt } from './orchestrator.prompt';
import { extractJson } from 'src/utils/extractJson';
import { ReturnsAgent } from 'src/agents/return/return.agent';

import { McpClientService } from 'src/mcp/client';
import { TechSupportAgent } from 'src/agents/tech/tech.agent';
import { ConversationStoreService } from 'src/session/conversation-store.service';
@Injectable()
export class OrchestratorAgent {
  private context: ConversationContext | null = null;

  constructor(
    private readonly llm: LlmService,
    private readonly billingAgent: BillingAgent,
    private readonly returnsAgent: ReturnsAgent,
    private readonly mcp: McpClientService,
    private readonly techAgent: TechSupportAgent,
    private readonly store: ConversationStoreService
  ) { }

  async handle(message: string, sessionId: string): Promise<string> {
    let ctx = (await this.store.get(sessionId)) as ConversationContext | null;
    if (ctx?.awaitingSlot) {
      const slot = ctx.awaitingSlot;

      if (slot === 'orderId') {
        const num = Number(message);
        if (Number.isNaN(num)) {
          return 'Order ID must be a number. Please provide a valid orderId.';
        }
        ctx.slots.orderId = num;
        console.log(`Slot filled: orderId = ${num}`);
      } else {
        ctx.slots[slot] = message;
        console.log(`Slot filled: ${slot} = ${message}`);
      }

      ctx.awaitingSlot = undefined;
      await this.store.set(sessionId, ctx);
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
        if (this.context.awaitingSlot === "email") return "Please provide your email address for confirmation.";

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
      } else if (step.agent === "tech") {
        
        const issueDescription = input.issueDescription ?? message;

        const techRes = await this.techAgent.handleWithPrompt({
          message: issueDescription,
          context: this.context,
        });

        if (typeof techRes === "string") {
          stepResults.push(techRes);
        } else {
          const steps = Array.isArray(techRes.steps) ? techRes.steps : [];
          const qs = Array.isArray(techRes.clarifyingQuestions) ? techRes.clarifyingQuestions : [];
          const answer = techRes.answer ?? "Here are some steps to try:";

          const formatted =
            answer +
            (steps.length ? `Steps:- ${steps.join(" - ")}` : "") +
            (qs.length ? `Questions: - ${qs.join(" - ")}` : "");

          stepResults.push(formatted);
        }
      }

      else {
        return 'Unsupported agent.';
      }

      this.context.currentStep++;
    }

    this.context = null;
    return stepResults.join(', ');
  }
}
