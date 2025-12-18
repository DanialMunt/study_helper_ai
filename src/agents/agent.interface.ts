export interface Agent {
  name: string;
  handle(input: any): Promise<string>;
}
