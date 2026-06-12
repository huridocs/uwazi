import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from '#api/common.v2/infrastructure/AbstractController.js';
import { AIAssistantFactory } from '../AIAssistantFactory.js';
import { buildUwaziCredentials } from './buildUwaziCredentials.js';

type Dependencies = AbstractControllerDependencies<Request>;

const RequestSchema = z.object({
  jobId: z.string().trim().min(1),
  password: z.string().min(1),
});

type Request = z.infer<typeof RequestSchema>;

class CancelAIAssistantConversationController extends AbstractController<Request> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);

    this.ensureUser();

    const credentials = buildUwaziCredentials(this.request, dto.password);
    if (!credentials) {
      this.clientError('User username not found');
      return;
    }

    const useCase = AIAssistantFactory.createCancelConversation();
    await useCase.execute({
      tenantName: this.tenantName,
      jobId: dto.jobId,
      credentials,
    });

    this.response.status(204).send();
  }
}

export { CancelAIAssistantConversationController };
