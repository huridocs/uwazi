import { z } from 'zod';
import type { AIAssistantProvider, AIAssistantSettings } from '#shared/types/settingsType.js';

const DEFAULT_PROVIDER: AIAssistantProvider = 'bert-external';

const AIAssistantSettingsInputSchema = z.object({
  provider: z.enum(['bert-external', 'openai_compat', 'anthropic', 'ollama']),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
});

type AIAssistantSettingsView = {
  provider: AIAssistantProvider;
  requiresPassword: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

const requiresPassword = (provider: AIAssistantProvider) => provider === 'bert-external';

const toSettingsView = (
  stored: AIAssistantSettings | undefined,
  includeSecrets: boolean
): AIAssistantSettingsView => {
  const provider = stored?.provider ?? DEFAULT_PROVIDER;
  const view: AIAssistantSettingsView = {
    provider,
    requiresPassword: requiresPassword(provider),
  };

  if (includeSecrets) {
    if (stored?.apiKey) {
      view.apiKey = stored.apiKey;
    }
    if (stored?.baseUrl) {
      view.baseUrl = stored.baseUrl;
    }
    if (stored?.model) {
      view.model = stored.model;
    }
  }

  return view;
};

export { AIAssistantSettingsInputSchema, DEFAULT_PROVIDER, requiresPassword, toSettingsView };
export type { AIAssistantSettingsView };
