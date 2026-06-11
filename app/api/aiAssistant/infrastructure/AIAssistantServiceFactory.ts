import { config } from '#api/config.js';
import { HttpClientFactory } from '#api/common.v2/infrastructure/HttpClientFactory.js';
import type { AIAssistantService } from '../domain/AIAssistantService.js';
import { ExternalAIAssistantService } from './ExternalAIAssistantService.js';

class AIAssistantServiceFactory {
  static createDefault(): AIAssistantService {
    const url = config.externalServicesUrls.aiAssistant;

    // eslint-disable-next-line no-console
    console.log('[aiAssistant] service.factory', {
      aiAssistantUrl: url,
      externalServicesEnabled: config.externalServices,
    });

    return new ExternalAIAssistantService({
      url,
      httpClient: HttpClientFactory.createDefault(),
    });
  }
}

export { AIAssistantServiceFactory };
