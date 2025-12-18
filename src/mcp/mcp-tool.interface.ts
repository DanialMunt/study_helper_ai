export interface McpTool<TInput, TOutput> {
  name: string;
  execute(input: TInput): Promise<TOutput>;
}
