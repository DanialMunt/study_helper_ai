import { Injectable } from '@nestjs/common';
import { ReturnTool } from 'src/tools/return/return.tool';
import { LlmService } from 'src/llm/llm.service';
import { returnsAgentPrompt } from './returnsAgent.prompt';
import { extractJson } from 'src/utils/extractJson';

@Injectable()
export class ReturnsAgent {
  constructor(
    private readonly returnTool: ReturnTool,
    private readonly llm: LlmService,
  ) {}

  async handle(action: string, input: any) {
    if (action === 'check_return_eligibility') {
      const { orderId } = input;
      const result = await this.returnTool.handle(orderId);
      return result;
    }
    throw new Error('Unknown returns action');
  }

  async handleWithPrompt(input: { orderId: number; context?: any }) {
    const { orderId, context = {} } = input;

    const toolResult = await this.returnTool.handle(orderId);
    const { eligible, refunded } = toolResult;
    console.log('True flags:', eligible, refunded);
    const prompt = returnsAgentPrompt(orderId, eligible, refunded, context);

    const raw = await this.llm.generate(prompt);
    console.log("Returns Agent's response: ", raw);

    let result: any;
    try {
      result = extractJson(raw);
    } catch (e) {
      console.error('Invalid LLM output for ReturnsAgent:', raw);
      return {
        decision: 'rejected',
        reason: 'Invalid LLM output',
        message: 'Cannot determine eligibility.',
      };
    }

    // TOOL VALIDATION ALWAYS WINS
    if (!toolResult?.eligible) {
      return {
        decision: 'rejected',
        reason: 'Order is not eligible for return (tool validation)',
        message: toolResult.message,
      };
    }

    if (toolResult.refunded) {
      return {
        decision: 'rejected',
        reason: 'Order is already refunded (tool validation)',
        message: toolResult.message,
      };
    }

    // LLM VALIDATION NEXT
    if (result.decision !== 'approved') {
      return {
        decision: 'rejected',
        reason: result.reason,
        message: result.message,
      };
    }

    // FINAL APPROVED
    return {
      decision: 'approved',
      reason: result.reason ?? 'Eligibility confirmed',
      message: result.message ?? `Invoice ${orderId} is eligible for return.`,
    };
  }
}
