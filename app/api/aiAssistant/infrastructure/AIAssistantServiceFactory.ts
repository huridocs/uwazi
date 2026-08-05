import { tenants } from '#api/tenants/index.js';
import { HttpClientFactory } from '#api/common.v2/infrastructure/HttpClientFactory.js';
import type { AIAssistantService } from '../application/contracts/AIAssistantService.js';
import { ExternalAIAssistantService } from './ExternalAIAssistantService.js';

class AIAssistantServiceFactory {
  static createDefault(): AIAssistantService {
    const url = tenants.current().featureFlags?.aiAssistantServiceUrl;

    if (!url) {
      throw new Error('AI Assistant service URL is not configured for this tenant');
    }

    return new ExternalAIAssistantService({
      url,
      httpClient: HttpClientFactory.createDefault(),
    });
  }
}

export { AIAssistantServiceFactory };
