import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { AIAssistantFactory } from '../AIAssistantFactory.js';

const RequestSchema = z.object({
  jobId: z.string().min(1),
});

type RequestBody = z.infer<typeof RequestSchema>;

class ClearAIAssistantConversationController extends AbstractController<RequestBody> {
  async handle(): Promise<void> {
    this.ensureUser();
    const dto = RequestSchema.parse(this.request.body);
    AIAssistantFactory.clearConversation(dto.jobId);
    this.response.json({ ok: true });
  }
}

export { ClearAIAssistantConversationController };
