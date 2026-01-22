import { Injectable } from "@nestjs/common";
import { LlmService } from "src/llm/llm.service";
import { McpClientService } from "src/mcp/client";
import { extractJson } from "src/utils/extractJson";
import { techAgentPrompt } from "./techAgent.prompt";

@Injectable()
export class TechSupportAgent {
  constructor(
    private readonly mcp: McpClientService,
    private readonly llm: LlmService,
  ) {}

  async handleWithPrompt(input: { message: string; context?: any }) {
    const { message, context = {} } = input;

    const kb = await this.mcp.callTool<
      { query: string; limit?: number },
      { results: Array<{ id: string; title: string; content: string; tags: string[] }> }
    >("kb.search", { query: message, limit: 3 });

    const prompt = techAgentPrompt({
      userMessage: message,
      kbResults: kb.results ?? [],
    });

    const raw = await this.llm.generate(prompt);

    try {
      const result = extractJson(raw);
      return result;
    } catch {
      // fallback deterministic response
      return {
        answer: "I couldn't format a reliable response. Please share more details (error message and screenshot).",
        steps: [],
        clarifyingQuestions: ["What exact error do you see?", "What device/OS are you using?"],
        usedKbIds: [],
        needsEscalation: true,
      };
    }
  }
}
