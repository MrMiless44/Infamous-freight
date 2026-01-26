type EnforcementAction = {
  id: string;
  [key: string]: unknown;
};

const actions = new Map<string, EnforcementAction>();

export function createEnforcementAction(
  id: string,
  action: EnforcementAction,
): EnforcementAction {
  if (actions.has(id)) {
    throw new Error(`Duplicate enforcement action id: ${id}`);
  }

  actions.set(id, action);
  return action;
}
