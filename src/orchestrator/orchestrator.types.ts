export type OrchestratorPlan = {
  intent: string;
  plan: {
    agent: 'billing';
    action: 'get_total_balance';
    input: Record<string, any>;
  };
};
