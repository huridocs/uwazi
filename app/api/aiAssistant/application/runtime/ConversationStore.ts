import type { LlmChatMessage } from '../contracts/LlmProvider.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

type StoreOptions = {
  ttlMs?: number;
  now?: () => number;
};

type ConversationRecord = {
  messages: LlmChatMessage[];
  expiresAt: number;
};

class ConversationStore {
  private readonly ttlMs: number;

  private readonly now: () => number;

  private readonly conversations = new Map<string, ConversationRecord>();

  constructor(options: StoreOptions = {}) {
    this.ttlMs = options.ttlMs ?? TWO_HOURS_MS;
    this.now = options.now ?? Date.now;
  }

  get(conversationId: string): LlmChatMessage[] {
    const record = this.conversations.get(conversationId);
    if (!record) {
      return [];
    }
    if (record.expiresAt <= this.now()) {
      this.conversations.delete(conversationId);
      return [];
    }
    return [...record.messages];
  }

  append(conversationId: string, message: LlmChatMessage): void {
    const messages = this.get(conversationId);
    this.conversations.set(conversationId, {
      messages: [...messages, message],
      expiresAt: this.now() + this.ttlMs,
    });
  }

  replace(conversationId: string, messages: LlmChatMessage[]): void {
    this.conversations.set(conversationId, {
      messages: [...messages],
      expiresAt: this.now() + this.ttlMs,
    });
  }

  clear(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}

const defaultConversationStore = new ConversationStore();

export { ConversationStore, defaultConversationStore, TWO_HOURS_MS };
