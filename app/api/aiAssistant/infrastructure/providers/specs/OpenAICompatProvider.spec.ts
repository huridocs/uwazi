import { OpenAICompatProvider } from '../OpenAICompatProvider.js';

const postJson = jest.fn();

describe('OpenAICompatProvider', () => {
  beforeEach(() => {
    postJson.mockReset();
  });

  it('should POST chat completions with tools and map a text reply', async () => {
    postJson.mockResolvedValue({
      choices: [{ message: { role: 'assistant', content: 'Hi there' } }],
    });

    const provider = new OpenAICompatProvider({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-4.1-mini',
      postJson,
    });

    const result = await provider.complete({
      messages: [{ role: 'user', content: 'Hello' }],
      tools: [
        {
          name: 'search_query',
          description: 'Search the collection',
          parameters: { type: 'object', properties: { searchTerm: { type: 'string' } } },
        },
      ],
    });

    expect(postJson).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { Authorization: 'Bearer sk-test' },
      })
    );
    const [[posted]] = postJson.mock.calls;
    expect(posted.body.model).toBe('gpt-4.1-mini');
    expect(posted.body.tools[0].function.name).toBe('search_query');
    expect(result).toEqual({ type: 'message', content: 'Hi there' });
  });

  it('should map tool calls from the model', async () => {
    postJson.mockResolvedValue({
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call-1',
                function: { name: 'entities_get', arguments: '{"sharedId":"abc"}' },
              },
            ],
          },
        },
      ],
    });

    const provider = new OpenAICompatProvider({
      baseUrl: 'https://example.test/v1',
      model: 'local-model',
      postJson,
    });

    await expect(
      provider.complete({
        messages: [{ role: 'user', content: 'Get abc' }],
        tools: [],
      })
    ).resolves.toEqual({
      type: 'tool_calls',
      calls: [{ id: 'call-1', name: 'entities_get', arguments: { sharedId: 'abc' } }],
    });
  });
});
