import type { AIAssistantSettings } from '#shared/types/settingsType.js';
import type { LlmProvider } from '../../application/contracts/LlmProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { OllamaProvider } from './OllamaProvider.js';
import { OpenAICompatProvider } from './OpenAICompatProvider.js';

const DEFAULT_MODELS = {
  openai_compat: 'gpt-4.1-mini',
  anthropic: 'claude-sonnet-4-5',
  ollama: 'llama3.1',
} as const;

class LlmProviderFactory {
  static create(settings: AIAssistantSettings): LlmProvider {
    switch (settings.provider) {
      case 'openai_compat':
        return LlmProviderFactory.openai(settings);
      case 'anthropic':
        return LlmProviderFactory.anthropic(settings);
      case 'ollama':
        return LlmProviderFactory.ollama(settings);
      default:
        throw new Error(`Unsupported LLM provider: ${settings.provider}`);
    }
  }

  private static requireApiKey(settings: AIAssistantSettings, label: string): string {
    if (!settings.apiKey) {
      throw new Error(`${label} requires an API key`);
    }
    return settings.apiKey;
  }

  private static openai(settings: AIAssistantSettings): LlmProvider {
    return new OpenAICompatProvider({
      baseUrl: settings.baseUrl?.trim() || 'https://api.openai.com/v1',
      apiKey: LlmProviderFactory.requireApiKey(settings, 'OpenAI-compatible provider'),
      model: settings.model?.trim() || DEFAULT_MODELS.openai_compat,
    });
  }

  private static anthropic(settings: AIAssistantSettings): LlmProvider {
    return new AnthropicProvider({
      baseUrl: settings.baseUrl?.trim(),
      apiKey: LlmProviderFactory.requireApiKey(settings, 'Anthropic provider'),
      model: settings.model?.trim() || DEFAULT_MODELS.anthropic,
    });
  }

  private static ollama(settings: AIAssistantSettings): LlmProvider {
    return new OllamaProvider({
      baseUrl: settings.baseUrl?.trim(),
      apiKey: settings.apiKey,
      model: settings.model?.trim() || DEFAULT_MODELS.ollama,
    });
  }
}

export { LlmProviderFactory };
