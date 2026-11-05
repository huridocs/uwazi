import type {
  LlmChatMessage,
  LlmCompleteInput,
  LlmCompleteResult,
  LlmProvider,
} from '../../application/contracts/LlmProvider.js';
import { postJson as defaultPostJson, trimSlash, type JsonPoster } from './postJson.js';

type AnthropicProviderOptions = {
  baseUrl?: string;
  apiKey: string;
  model: string;
  postJson?: JsonPoster;
};

type AnthropicContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };

type AnthropicResponse = {
  content?: AnthropicContent[];
  error?: { message?: string };
};

const pushToolResult = (
  converted: Array<{ role: 'user' | 'assistant'; content: unknown }>,
  message: Extract<LlmChatMessage, { role: 'tool' }>
) => {
  const toolResult = {
    type: 'tool_result',
    tool_use_id: message.tool_call_id,
    content: message.content,
  };
  const last = converted[converted.length - 1];
  if (last?.role === 'user' && Array.isArray(last.content)) {
    last.content.push(toolResult);
    return;
  }
  converted.push({ role: 'user', content: [toolResult] });
};

const toAnthropicMessages = (messages: LlmChatMessage[]) => {
  const converted: Array<{ role: 'user' | 'assistant'; content: unknown }> = [];

  messages
    .filter(message => message.role !== 'system')
    .forEach(message => {
      if (message.role === 'tool') {
        pushToolResult(converted, message);
        return;
      }

      if (message.role === 'assistant' && 'tool_calls' in message) {
        converted.push({
          role: 'assistant',
          content: [
            ...(message.content ? [{ type: 'text', text: message.content }] : []),
            ...message.tool_calls.map(call => ({
              type: 'tool_use',
              id: call.id,
              name: call.name,
              input: call.arguments,
            })),
          ],
        });
        return;
      }

      converted.push({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content ?? '',
      });
    });

  return converted;
};

const toResult = (body: AnthropicResponse): LlmCompleteResult => {
  if (body.error?.message) {
    throw new Error(body.error.message);
  }

  const content = body.content ?? [];
  const toolUses = content.filter(
    (block): block is Extract<AnthropicContent, { type: 'tool_use' }> => block.type === 'tool_use'
  );

  if (toolUses.length) {
    return {
      type: 'tool_calls',
      calls: toolUses.map(block => ({
        id: block.id,
        name: block.name,
        arguments: block.input ?? {},
      })),
    };
  }

  const text = content
    .filter((block): block is Extract<AnthropicContent, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim();

  return { type: 'message', content: text };
};

class AnthropicProvider implements LlmProvider {
  private readonly postJson: JsonPoster;

  constructor(private options: AnthropicProviderOptions) {
    this.postJson = options.postJson ?? defaultPostJson;
  }

  async complete(input: LlmCompleteInput): Promise<LlmCompleteResult> {
    const system = input.messages
      .filter(message => message.role === 'system')
      .map(message => message.content)
      .join('\n');

    const body = (await this.postJson({
      url: `${trimSlash(this.options.baseUrl || 'https://api.anthropic.com')}/v1/messages`,
      headers: {
        'x-api-key': this.options.apiKey,
        'anthropic-version': '2023-06-01',
      },
      timeoutMs: 120_000,
      body: {
        model: this.options.model,
        max_tokens: 4096,
        system: system || undefined,
        messages: toAnthropicMessages(input.messages),
        tools: input.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters,
        })),
      },
    })) as AnthropicResponse;

    return toResult(body);
  }
}

export { AnthropicProvider };
