import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from 'src/invoice/entity/invoice.entity';
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
    private readonly store: ConversationStoreService,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) { }

  async handle(
  message: string,
  sessionId?: string,
): Promise<{ reply: string; sessionId: string }> {

  let sid: string | null = sessionId ?? null;
  let ctx: ConversationContext | null = sid
    ? ((await this.store.get(sid)) as ConversationContext | null)
    : null;


  if (ctx?.awaitingSlot) {
    const slot = ctx.awaitingSlot;

    if (slot === "orderId") {
      const num = Number(message);
      if (Number.isNaN(num)) {
        return { reply: "Order ID must be a number. Please provide a valid orderId.", sessionId: sid! };
      }
      ctx.slots.orderId = num;
    } else {
      ctx.slots[slot] = message;
    }

    ctx.awaitingSlot = undefined;
    await this.store.set(sid!, ctx);
  }

  // 2) Create plan if ctx doesn't exist (new session)
  if (!ctx) {
    const raw = await this.llm.generate(orchestratorPrompt(message));

    let planJson: OrchestratorPlan;
    try {
      planJson = extractJson(raw);
    } catch {
      // If we have no session yet, create a temporary one only if you want.
      // Simpler: just reply without session.
      return { reply: "Sorry, something went wrong.", sessionId: sid ?? "" };
    }

    if (!planJson?.plan?.length) {
      return { reply: "Sorry, your request is unsupported.", sessionId: sid ?? "" };
    }

    ctx = {
      intent: planJson.intent,
      plan: planJson.plan,
      currentStep: 0,
      slots: {},
      awaitingSlot: undefined,
    };

    // Create DB-generated sessionId if missing
    if (!sid) {
      sid = await this.store.create(ctx);
    } else {
      await this.store.set(sid, ctx);
    }
  }

  // sid must exist now
  if (!sid) {
    // Should not happen, but keeps TS happy
    return { reply: "Sorry, session initialization failed.", sessionId: "" };
  }

  const stepResults: string[] = [];

  // 3) Execute plan
  while (ctx.currentStep < ctx.plan.length) {
    const step = ctx.plan[ctx.currentStep];

    if (step.agent === "email") {
      step.requiredSlots = ["orderId"];
    }

// Ask for missing slots EXCEPT email step (email step never asks user)
    if (step.agent !== "email") {
      for (const slot of step.requiredSlots ?? []) {
        if (!ctx.slots[slot]) {
          ctx.awaitingSlot = slot;
          await this.store.set(sid, ctx);
          return { reply: `Please provide ${slot}.`, sessionId: sid };
        }
      }
    }

    // Merge slots into input
    step.input = { ...step.input, ...ctx.slots };
    const input = { ...step.input };

    if (step.agent === "returns") {
      const returnsResult = await this.returnsAgent.handleWithPrompt({
        orderId: input.orderId,
        context: ctx,
      });

      if (returnsResult.decision !== "approved") {
        await this.store.clear(sid);
        return {
          reply: returnsResult.message || "This order is not eligible for return.",
          sessionId: sid,
        };
      }

      stepResults.push(returnsResult.message);
    } else if (step.agent === "billing") {
      if (!input.orderId) {
        await this.store.clear(sid);
        return { reply: "Cannot proceed: missing orderId.", sessionId: sid };
      }

      const billingResult = await this.billingAgent.handleWithPrompt({
        orderId: input.orderId,
        decision: "approved",
        context: ctx,
      });

      if (billingResult.status !== "success") {
        await this.store.clear(sid);
        return { reply: billingResult.message || "Refund failed.", sessionId: sid };
      }

      stepResults.push(billingResult.message);
    } else if (step.agent === "email") {
      const invoice = await this.invoiceRepo.findOne({
        where: { id: input.orderId },
        relations: { user: true },
      });

      if (!invoice || !invoice.user) {
        await this.store.clear(sid);
        return { reply: "Unable to find user email for this order.", sessionId: sid };
      }

      const userEmail = invoice.user.email;
      const itemDescription = invoice.description ?? "No description provided";
      const itemAmount = invoice.amount;

      const emailRes = await this.mcp.callTool(
        "email.send_refund_confirmation",
        {
          email: userEmail,
          invoiceId: input.orderId,
          description: itemDescription,
          amount: itemAmount
        }
      );

      stepResults.push(
        `Confirmation email sent to ${userEmail} (${emailRes.id}). ` +
        `Item: "${itemDescription}", Amount: €${itemAmount}.`
      );

    } else if (step.agent === "tech") {
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
          (steps.length ? `\n\nSteps:\n- ${steps.join("\n- ")}` : "") +
          (qs.length ? `\n\nQuestions:\n- ${qs.join("\n- ")}` : "");

        stepResults.push(formatted);
      }
    } else {
      await this.store.clear(sid);
      return { reply: "Unsupported agent.", sessionId: sid };
    }

    ctx.currentStep++;
    await this.store.set(sid, ctx);
  }

  // 4) Done
  await this.store.clear(sid);
  return { reply: stepResults.join(", "), sessionId: sid };
}
}
