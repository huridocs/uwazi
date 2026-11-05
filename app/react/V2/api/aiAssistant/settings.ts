import { IncomingHttpHeaders } from 'http';
import { RequestParams } from '#app/utils/RequestParams.js';
import { api } from '#app/utils/api.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { ApiResponse } from '../ApiResponse.js';

type AIAssistantProvider = 'bert-external' | 'openai_compat' | 'anthropic' | 'ollama';

type AIAssistantClientSettings = {
  provider: AIAssistantProvider;
  requiresPassword: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

const getSettings = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<AIAssistantClientSettings | undefined, FetchResponseError>> => {
  try {
    const response = await api.get('aiAssistant/settings', new RequestParams({}, headers));
    return [response.json as AIAssistantClientSettings, undefined];
  } catch (error) {
    return [undefined, error as FetchResponseError];
  }
};

const saveSettings = async (
  settings: Omit<AIAssistantClientSettings, 'requiresPassword'>,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<AIAssistantClientSettings | undefined, FetchResponseError>> => {
  try {
    const response = await api.post('aiAssistant/settings', new RequestParams(settings, headers));
    return [response.json as AIAssistantClientSettings, undefined];
  } catch (error) {
    return [undefined, error as FetchResponseError];
  }
};

export { getSettings, saveSettings };
export type { AIAssistantClientSettings, AIAssistantProvider };
