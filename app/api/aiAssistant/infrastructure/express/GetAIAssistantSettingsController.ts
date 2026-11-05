import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { AIAssistantFactory } from '../AIAssistantFactory.js';

class GetAIAssistantSettingsController extends AbstractController {
  async handle(): Promise<void> {
    this.ensureUser();
    const includeSecrets = this.user.role === 'admin';
    const result = await AIAssistantFactory.createGetSettings().execute({ includeSecrets });
    this.response.json(result);
  }
}

export { GetAIAssistantSettingsController };
