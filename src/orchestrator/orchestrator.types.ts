export type OrchestratorPlan = {
  intent: string;
  plan: PlanStep[] | null;
};

export type AgentName = "billing" | "returns" | "email" | "tech"

export type PlanStep = {
  agent: AgentName;
  action: string;
  input: Record<string, any>;
  requiredSlots?: string[];
};

export type ConversationContext = {
  intent: string;
  plan: PlanStep[];
  currentStep: number;
  slots: Record<string, any>;     
  awaitingSlot?: string;         
};