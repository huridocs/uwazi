import { config } from '#api/config.js';
import { HttpClientFactory } from '#api/common.v2/infrastructure/HttpClientFactory.js';
import type { AIAssistantService } from '../domain/AIAssistantService.js';
import { ExternalAIAssistantService } from './ExternalAIAssistantService.js';

class AIAssistantServiceFactory {
  static createDefault(): AIAssistantService {
    return new ExternalAIAssistantService({
      url: config.externalServicesUrls.aiAssistant,
      httpClient: HttpClientFactory.createDefault(),
    });
  }
}

export { AIAssistantServiceFactory };
