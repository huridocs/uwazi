import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AIAssistantFactory } from '../AIAssistantFactory.js';

const RequestSchema = z.object({
  jobId: z.string().min(1),
  toolCallId: z.string().min(1),
  decision: z.enum(['yes', 'yes_dont_ask', 'no']),
});

type RequestBody = z.infer<typeof RequestSchema>;

class ConfirmAIAssistantToolController extends AbstractController<RequestBody> {
  async handle(): Promise<void> {
    this.ensureUser();
    const dto = RequestSchema.parse(this.request.body);
    const result = await AIAssistantFactory.createConfirmTool().execute({
      ...dto,
      sessionId: ExecutionContext.sessionId,
    });
    this.response.json(result);
  }
}

export { ConfirmAIAssistantToolController };
