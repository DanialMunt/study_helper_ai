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
  // private context: ConversationContext | null = null;

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
        await this.store.set(sessionId, ctx);
        console.log(`Slot filled: ${slot} = ${message}`);
      }

      ctx.awaitingSlot = undefined;
      await this.store.set(sessionId, ctx);
    }

    if (!ctx) {
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

      ctx = {
        intent: planJson.intent,
        plan: planJson.plan,
        currentStep: 0,
        slots: {},
        awaitingSlot: undefined,
      };
      await this.store.set(sessionId, ctx);
      console.log('Initial plan:', ctx.plan);
    }

    const stepResults: string[] = [];

    while (ctx.currentStep < ctx.plan.length) {
      const step = ctx.plan[ctx.currentStep];
      console.log('Current step:', step);

      for (const slot of step.requiredSlots ?? []) {
        if (!ctx.slots[slot]) {
          ctx.awaitingSlot = slot;
          await this.store.set(sessionId, ctx);
          return `Please provide ${slot}.`;
        }
        if (ctx.awaitingSlot === "email") return "Please provide your email address for confirmation.";

      }
      step.input = {
        ...step.input,
        ...ctx.slots,
      };

      const input = { ...step.input };

      if (step.agent === 'returns') {
        const returnsResult = await this.returnsAgent.handleWithPrompt({
          orderId: input.orderId,
          context: ctx,
        });

        console.log('ReturnsAgent result:', returnsResult);

        if (returnsResult.decision !== 'approved') {
          await this.store.clear(sessionId);
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
          context: ctx,
        });

        console.log('BillingAgent result:', billingResult);

        if (billingResult.status !== 'success') {
          await this.store.clear(sessionId);
          return billingResult.message || 'Refund failed.';
        }

        stepResults.push(billingResult.message);
      } else if (step.agent === "email") {
        const email = input.email;
        const orderId = input.orderId;

        const emailRes = await this.mcp.callTool(
          "email.send_refund_confirmation",
          { email, invoiceId: orderId }
        );

             stepResults.push(`Confirmation email sent (${emailRes.id}).`);
      }


      else if (step.agent === "tech") {

        const issueDescription = input.issueDescription ?? message;

        const techRes = await this.techAgent.handleWithPrompt({
          message: issueDescription,
          context: ctx,
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

      ctx.currentStep++;
      await this.store.set(sessionId, ctx);
    }

    // await this.store.clear(sessionId);
    return stepResults.join(', ');
  }
}
