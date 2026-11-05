import { ConversationStore } from '../ConversationStore.js';

describe('ConversationStore', () => {
  it('should keep messages for a conversation until TTL expires', () => {
    let now = 1_000;
    const store = new ConversationStore({ ttlMs: 2 * 60 * 60 * 1000, now: () => now });

    store.append('conv-1', { role: 'user', content: 'Hello' });
    expect(store.get('conv-1')).toEqual([{ role: 'user', content: 'Hello' }]);

    now += 2 * 60 * 60 * 1000 - 1;
    expect(store.get('conv-1')).toHaveLength(1);

    now += 2;
    expect(store.get('conv-1')).toEqual([]);
  });

  it('should isolate conversations and clear on demand', () => {
    const store = new ConversationStore();
    store.append('a', { role: 'user', content: 'A' });
    store.append('b', { role: 'user', content: 'B' });

    store.clear('a');
    expect(store.get('a')).toEqual([]);
    expect(store.get('b')).toEqual([{ role: 'user', content: 'B' }]);
  });
});
