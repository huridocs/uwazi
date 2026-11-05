import type {
  LlmChatMessage,
  LlmCompleteInput,
  LlmCompleteResult,
  LlmProvider,
  LlmToolCall,
} from '../../application/contracts/LlmProvider.js';
import { postJson as defaultPostJson, trimSlash, type JsonPoster } from './postJson.js';

type OpenAICompatProviderOptions = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  postJson?: JsonPoster;
};

type OpenAIToolCall = {
  id: string;
  function?: { name?: string; arguments?: string };
};

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
    };
  }>;
  error?: { message?: string };
};

const toOpenAIMessages = (messages: LlmChatMessage[]) =>
  messages.map(message => {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.tool_call_id,
        content: message.content,
      };
    }
    if (message.role === 'assistant' && 'tool_calls' in message) {
      return {
        role: 'assistant',
        content: message.content,
        tool_calls: message.tool_calls.map(call => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })),
      };
    }
    return { role: message.role, content: message.content };
  });

const parseArguments = (raw: string | undefined): Record<string, unknown> => {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const toToolCalls = (calls: OpenAIToolCall[] | undefined): LlmToolCall[] =>
  (calls ?? [])
    .map((call): LlmToolCall => ({
      id: call.id,
      name: call.function?.name ?? '',
      arguments: parseArguments(call.function?.arguments),
    }))
    .filter(call => call.name);

const toResult = (body: OpenAIResponse): LlmCompleteResult => {
  if (body.error?.message) {
    throw new Error(body.error.message);
  }

  const message = body.choices?.[0]?.message;
  const toolCalls = toToolCalls(message?.tool_calls);
  if (toolCalls.length) {
    return { type: 'tool_calls', calls: toolCalls };
  }

  return { type: 'message', content: message?.content?.trim() ?? '' };
};

class OpenAICompatProvider implements LlmProvider {
  private readonly postJson: JsonPoster;

  constructor(private options: OpenAICompatProviderOptions) {
    this.postJson = options.postJson ?? defaultPostJson;
  }

  async complete(input: LlmCompleteInput): Promise<LlmCompleteResult> {
    const headers: Record<string, string> = {};
    if (this.options.apiKey) {
      headers.Authorization = `Bearer ${this.options.apiKey}`;
    }

    const body = (await this.postJson({
      url: `${trimSlash(this.options.baseUrl)}/chat/completions`,
      headers,
      timeoutMs: 120_000,
      body: {
        model: this.options.model,
        messages: toOpenAIMessages(input.messages),
        tools: input.tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
      },
    })) as OpenAIResponse;

    return toResult(body);
  }
}

export { OpenAICompatProvider };
export type { OpenAICompatProviderOptions };
