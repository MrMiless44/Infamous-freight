export interface GenesisSessionMemory {
  tenantId: string;
  userId?: string;
  lastSeenAt: number;
  avatarState: string;
  recentCommands: Array<Record<string, unknown>>;
  prefs: Record<string, unknown>;
}

export interface SessionStore {
  get(tenantId: string, userId?: string): Promise<GenesisSessionMemory>;
  set(mem: GenesisSessionMemory): Promise<void>;
  patch(tenantId: string, userId: string | undefined, patch: Partial<GenesisSessionMemory>): Promise<GenesisSessionMemory>;
  pushCommand(tenantId: string, userId: string | undefined, cmd: Record<string, unknown>): Promise<GenesisSessionMemory>;
}

export interface PrismaGenesisSessionClient {
  genesisSession: {
    findUnique(args: { where: { k: string } }): Promise<{ payload: unknown } | null>;
    upsert(args: {
      where: { k: string };
      create: { k: string; organizationId: string; userId?: string | null; payload: unknown };
      update: { payload: unknown };
    }): Promise<unknown>;
  };
}

const keyFor = (tenantId: string, userId?: string) => `${tenantId}::${userId ?? "anon"}`;

export function createPrismaSessionStore(prisma: PrismaGenesisSessionClient, maxRecent = 25): SessionStore {
  return {
    async get(tenantId, userId) {
      const row = await prisma.genesisSession.findUnique({ where: { k: keyFor(tenantId, userId) } });
      if (row?.payload) return row.payload as GenesisSessionMemory;

      const now = Date.now();
      const fresh: GenesisSessionMemory = {
        tenantId,
        userId,
        lastSeenAt: now,
        avatarState: "idle",
        recentCommands: [],
        prefs: {},
      };

      await prisma.genesisSession.upsert({
        where: { k: keyFor(tenantId, userId) },
        create: { k: keyFor(tenantId, userId), organizationId: tenantId, userId: userId ?? null, payload: fresh },
        update: { payload: fresh },
      });

      return fresh;
    },

    async set(mem) {
      await prisma.genesisSession.upsert({
        where: { k: keyFor(mem.tenantId, mem.userId) },
        create: { k: keyFor(mem.tenantId, mem.userId), organizationId: mem.tenantId, userId: mem.userId ?? null, payload: mem },
        update: { payload: mem },
      });
    },

    async patch(tenantId, userId, patch) {
      const current = await this.get(tenantId, userId);
      const next: GenesisSessionMemory = {
        ...current,
        ...patch,
        prefs: { ...current.prefs, ...(patch.prefs ?? {}) },
        recentCommands: patch.recentCommands ?? current.recentCommands,
        lastSeenAt: Date.now(),
      };
      await this.set(next);
      return next;
    },

    async pushCommand(tenantId, userId, cmd) {
      const current = await this.get(tenantId, userId);
      const entry = { ...cmd, at: Date.now() };
      const recent = [entry, ...current.recentCommands].slice(0, maxRecent);
      const next = { ...current, recentCommands: recent, lastSeenAt: Date.now() };
      await this.set(next);
      return next;
    },
  };
}
