import { User } from '#api/users.v2/model/User.js';
import { ObjectId } from 'mongodb';
import type { AIAssistantNotifier } from '../../contracts/AIAssistantNotifier.js';
import type { LlmProvider } from '../../contracts/LlmProvider.js';
import type { AssistantTool } from '../../tools/Tool.js';
import { AgentLoop } from '../AgentLoop.js';
import { ConfirmationGate } from '../ConfirmationGate.js';
import { ConversationStore } from '../ConversationStore.js';

const editor = User.createFrom({
  _id: new ObjectId(),
  role: 'editor',
  groups: [],
  email: 'editor@test.com',
  username: 'editor',
});

const runInput = (conversationId: string, message: string) => ({
  conversationId,
  message,
  actor: editor,
  language: 'en' as const,
  sessionId: 'sid',
  protocol: 'http',
  instanceHost: 'localhost',
});

const createNotifier = (): AIAssistantNotifier & { calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    reply: payload => {
      calls.push(`reply:${payload.message}`);
    },
    progress: payload => {
      calls.push(`progress:${payload.progress}`);
    },
    error: payload => {
      calls.push(`error:${payload.error}`);
    },
    toolConfirm: payload => {
      calls.push(`confirm:${payload.toolName}`);
    },
    toolActivity: payload => {
      calls.push(`activity:${payload.toolName}:${payload.status}`);
    },
  };
};

const createLoop = (provider: LlmProvider, tools: AssistantTool[], gate?: ConfirmationGate) => {
  const notifier = createNotifier();
  const confirmationGate = gate ?? new ConfirmationGate();
  const loop = new AgentLoop({
    provider,
    tools,
    conversationStore: new ConversationStore(),
    confirmationGate,
    notifier,
  });
  return { loop, notifier, confirmationGate };
};

const searchTool = (): AssistantTool => ({
  name: 'search_query',
  description: 'Search',
  domain: 'search',
  sideEffect: 'read',
  adminOnly: false,
  parameters: { type: 'object', properties: { searchTerm: { type: 'string' } } },
  parse: args => args,
  execute: jest.fn().mockResolvedValue({ rows: [{ title: 'Case' }] }),
});

const createEntityTool = (): AssistantTool => ({
  name: 'entities_create',
  description: 'Create entity',
  domain: 'entities',
  sideEffect: 'write',
  adminOnly: false,
  parameters: { type: 'object', properties: {} },
  parse: args => args,
  execute: jest.fn().mockResolvedValue({ sharedId: 'abc' }),
});

const usersListTool = (): AssistantTool => ({
  name: 'users_list',
  description: 'List users',
  domain: 'users',
  sideEffect: 'read',
  adminOnly: true,
  parameters: { type: 'object', properties: {} },
  parse: args => args,
  execute: jest.fn(),
});

describe('AgentLoop', () => {
  it('should reply with the model text when no tools are called', async () => {
    const provider: LlmProvider = {
      complete: jest.fn().mockResolvedValue({ type: 'message', content: 'Hello from the model' }),
    };
    const { loop, notifier } = createLoop(provider, []);

    await loop.run(runInput('job-1', 'Hi'));

    expect(notifier.calls).toContain('reply:Hello from the model');
  });

  it('should execute a read tool without confirmation and feed the result back', async () => {
    const tool = searchTool();
    const provider: LlmProvider = {
      complete: jest
        .fn()
        .mockResolvedValueOnce({
          type: 'tool_calls',
          calls: [{ id: 'call-1', name: 'search_query', arguments: { searchTerm: 'honduras' } }],
        })
        .mockResolvedValueOnce({ type: 'message', content: 'I found the case.' }),
    };
    const { loop, notifier } = createLoop(provider, [tool]);

    await loop.run(runInput('job-2', 'Find Honduras'));

    expect(tool.execute).toHaveBeenCalled();
    expect(notifier.calls).toContain('activity:search_query:started');
    expect(notifier.calls).toContain('activity:search_query:finished');
    expect(notifier.calls).toContain('reply:I found the case.');
    expect(notifier.calls.some(call => call.startsWith('confirm:'))).toBe(false);
  });

  it('should ask for confirmation before a write and skip it for the rest of the session', async () => {
    const tool = createEntityTool();
    const provider: LlmProvider = {
      complete: jest
        .fn()
        .mockResolvedValueOnce({
          type: 'tool_calls',
          calls: [{ id: 'call-1', name: 'entities_create', arguments: { title: 'One' } }],
        })
        .mockResolvedValueOnce({ type: 'message', content: 'Created.' })
        .mockResolvedValueOnce({
          type: 'tool_calls',
          calls: [{ id: 'call-2', name: 'entities_create', arguments: { title: 'Two' } }],
        })
        .mockResolvedValueOnce({ type: 'message', content: 'Created again.' }),
    };
    const { loop, notifier, confirmationGate } = createLoop(provider, [tool]);
    const first = loop.run(runInput('job-3', 'Create one'));

    await new Promise(resolve => {
      setImmediate(resolve);
    });
    confirmationGate.resolve({
      jobId: 'job-3',
      toolCallId: 'call-1',
      decision: 'yes_dont_ask',
      sessionId: 'sid',
    });
    await first;
    await loop.run(runInput('job-4', 'Create two'));

    expect(tool.execute).toHaveBeenCalledTimes(2);
    expect(notifier.calls.filter(call => call.startsWith('confirm:'))).toEqual([
      'confirm:entities_create',
    ]);
  });

  it('should refuse admin-only tools for non-admins without calling them', async () => {
    const tool = usersListTool();
    const provider: LlmProvider = {
      complete: jest
        .fn()
        .mockResolvedValueOnce({
          type: 'tool_calls',
          calls: [{ id: 'call-1', name: 'users_list', arguments: {} }],
        })
        .mockResolvedValueOnce({ type: 'message', content: 'I cannot list users.' }),
    };
    const { loop, notifier } = createLoop(provider, [tool]);

    await loop.run(runInput('job-5', 'List users'));

    expect(tool.execute).not.toHaveBeenCalled();
    expect(notifier.calls).toContain('reply:I cannot list users.');
  });
});
