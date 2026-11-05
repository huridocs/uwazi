type LlmChatMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls: LlmToolCall[];
    }
  | { role: 'tool'; tool_call_id: string; name: string; content: string };

type LlmToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

type LlmToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

type LlmCompleteInput = {
  messages: LlmChatMessage[];
  tools: LlmToolDefinition[];
};

type LlmCompleteResult =
  { type: 'message'; content: string } | { type: 'tool_calls'; calls: LlmToolCall[] };

interface LlmProvider {
  complete(input: LlmCompleteInput): Promise<LlmCompleteResult>;
}

export type {
  LlmChatMessage,
  LlmCompleteInput,
  LlmCompleteResult,
  LlmProvider,
  LlmToolCall,
  LlmToolDefinition,
};
