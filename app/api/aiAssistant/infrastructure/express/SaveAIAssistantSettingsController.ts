import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { AIAssistantSettingsInputSchema } from '../../application/AIAssistantSettings.js';
import { AIAssistantFactory } from '../AIAssistantFactory.js';

type RequestBody = z.infer<typeof AIAssistantSettingsInputSchema>;

class SaveAIAssistantSettingsController extends AbstractController<RequestBody> {
  async handle(): Promise<void> {
    this.ensureUser();
    if (this.user.role !== 'admin') {
      this.response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const dto = AIAssistantSettingsInputSchema.parse(this.request.body);
    const result = await AIAssistantFactory.createSaveSettings().execute(dto);
    this.response.json(result);
  }
}

export { SaveAIAssistantSettingsController };
