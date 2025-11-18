// Simple in-memory message bus for ephemeral student messages
// Messages are keyed by a composite key (uniqueCode|email) and expire automatically

type LiveMessage = {
  id: string;
  content: string;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  scope?: 'all' | 'individual';
};

type MessageBucket = LiveMessage[];

interface BusAPI {
  publish: (key: string, content: string, ttlMs?: number, scope?: 'all' | 'individual') => LiveMessage;
  consume: (key: string) => LiveMessage[]; // returns and removes expired/consumed items
  peek: (key: string) => LiveMessage[]; // returns non-expired items without removing
  ack: (key: string, id: string) => boolean; // remove a specific message
  cleanExpired: () => void;
}

const DEFAULT_TTL_MS = 90_000; // 90s retention to tolerate polling and countdown

declare global {
  // Augment the global object with our in-memory bus instance
  // This avoids using `any` and keeps the type safe
  var __liveMessageBus: Map<string, MessageBucket> | undefined;
}

function getGlobalBus(): Map<string, MessageBucket> {
  const g: typeof globalThis = globalThis;
  if (!g.__liveMessageBus) {
    g.__liveMessageBus = new Map<string, MessageBucket>();
  }
  return g.__liveMessageBus;
}

function now(): number {
  return Date.now();
}

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const LiveMessageBus: BusAPI = {
  publish(key: string, content: string, ttlMs: number = DEFAULT_TTL_MS, scope: 'all' | 'individual' = 'individual') {
    const bus = getGlobalBus();
    const bucket = bus.get(key) ?? [];
    const msg: LiveMessage = {
      id: makeId(),
      content,
      createdAt: now(),
      expiresAt: now() + ttlMs,
      scope,
    };
    bucket.push(msg);
    bus.set(key, bucket);
    return msg;
  },

  consume(key: string) {
    const bus = getGlobalBus();
    const bucket = bus.get(key) ?? [];
    const current = now();
    const valid = bucket.filter((m) => m.expiresAt > current);
    // Return and clear bucket to avoid repeat consumption
    bus.set(key, []);
    return valid;
  },

  peek(key: string) {
    const bus = getGlobalBus();
    const bucket = bus.get(key) ?? [];
    const current = now();
    return bucket.filter((m) => m.expiresAt > current);
  },

  ack(key: string, id: string) {
    const bus = getGlobalBus();
    const bucket = bus.get(key) ?? [];
    const initialLen = bucket.length;
    const filtered = bucket.filter((m) => m.id !== id);
    bus.set(key, filtered);
    return filtered.length !== initialLen;
  },

  cleanExpired() {
    const bus = getGlobalBus();
    const current = now();
    for (const [key, bucket] of bus.entries()) {
      const filtered = bucket.filter((m) => m.expiresAt > current);
      bus.set(key, filtered);
    }
  },
};

export type { LiveMessage };