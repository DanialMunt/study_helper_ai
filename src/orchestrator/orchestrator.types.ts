export type OrchestratorPlan = {
  intent: string;
  plan: PlanStep[] | null;
};

export type PlanStep = {
  agent: 'billing' | 'returns';
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