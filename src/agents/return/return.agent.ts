import { Injectable } from '@nestjs/common';
import { ReturnTool } from 'src/tools/return/return.tool';
import { LlmService } from 'src/llm/llm.service';
import { returnsAgentPrompt } from './returnsAgent.prompt';
import { extractJson } from 'src/utils/extractJson';
import { McpClientService } from 'src/mcp/client';
@Injectable()
export class ReturnsAgent {
  constructor(
    private readonly returnTool: ReturnTool,
    private readonly llm: LlmService,
    private readonly mcp: McpClientService,
  ) {}


  async handleWithPrompt(input: { orderId: number; context?: any }) {
    const { orderId, context = {} } = input;

    // const toolResult = await this.returnTool.handle(orderId);
     const toolResult = await this.mcp.callTool<
      { invoiceId: number },
      { eligible: boolean; refunded: boolean; message: string }
    >("returns.check_eligibility", { invoiceId: orderId });
    
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

    
    if (result.decision !== 'approved') {
      return {
        decision: 'rejected',
        reason: result.reason,
        message: result.message,
      };
    }

    
    return {
      decision: 'approved',
      reason: result.reason ?? 'Eligibility confirmed',
      message: result.message ?? `Invoice ${orderId} is eligible for return.`,
    };
  }
}
