import { OpenAICompatProvider } from './OpenAICompatProvider.js';
import type { JsonPoster } from './postJson.js';
import { trimSlash } from './postJson.js';

type OllamaProviderOptions = {
  baseUrl?: string;
  apiKey?: string;
  model: string;
  postJson?: JsonPoster;
};

class OllamaProvider extends OpenAICompatProvider {
  constructor(options: OllamaProviderOptions) {
    super({
      baseUrl: `${trimSlash(options.baseUrl || 'http://localhost:11434')}/v1`,
      apiKey: options.apiKey,
      model: options.model,
      postJson: options.postJson,
    });
  }
}

export { OllamaProvider };
