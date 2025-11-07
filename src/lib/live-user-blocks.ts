// Simple in-memory user block registry with optional expiration
// Keyed by composite key: uniqueCode|email

export type BlockRecord = {
  key: string;
  blockedUntil: number; // epoch ms
};

declare global {
  // eslint-disable-next-line no-var
  var __liveUserBlocks: Map<string, number> | undefined;
}

function getStore(): Map<string, number> {
  const g: typeof globalThis = globalThis;
  if (!g.__liveUserBlocks) {
    g.__liveUserBlocks = new Map<string, number>();
  }
  return g.__liveUserBlocks;
}

function now(): number {
  return Date.now();
}

export function blockUser(key: string, minutes: number = 10): BlockRecord {
  const store = getStore();
  const durationMs = Math.max(1, minutes) * 60_000;
  const until = now() + durationMs;
  store.set(key, until);
  return { key, blockedUntil: until };
}

export function unblockUser(key: string): boolean {
  const store = getStore();
  return store.delete(key);
}

export function isUserBlocked(key: string): { blocked: boolean; remainingMs: number } {
  const store = getStore();
  const until = store.get(key) ?? 0;
  const current = now();
  if (until > current) {
    return { blocked: true, remainingMs: until - current };
  }
  // auto-expire
  if (until > 0) {
    store.delete(key);
  }
  return { blocked: false, remainingMs: 0 };
}

export function getAllBlocks(): BlockRecord[] {
  const store = getStore();
  const current = now();
  const list: BlockRecord[] = [];
  for (const [key, until] of store.entries()) {
    if (until > current) {
      list.push({ key, blockedUntil: until });
    } else {
      store.delete(key);
    }
  }
  return list;
}