export type EnforcementLevel = 'notice' | 'restricted' | 'suspended' | 'terminated';

export interface EnforcementAction {
  id: string;
  userId: string;
  level: EnforcementLevel;
  reason: string;
  createdAt: string;
}

export interface EnforcementCreateInput {
  userId: string;
  level: EnforcementLevel;
  reason: string;
}

export const enforcementApi = {
  enforce: (input: EnforcementCreateInput): EnforcementAction => {
    return {
      id: 'enforcement_0000000000',
      userId: input.userId,
      level: input.level,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };
  },
  getByUser: (userId: string): EnforcementAction[] => {
    return [
      {
        id: 'enforcement_0000000000',
        userId,
        level: 'restricted',
        reason: 'Automated risk review in progress.',
        createdAt: new Date().toISOString(),
      },
    ];
  },
};
