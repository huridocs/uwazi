import * as cookie from 'cookie';
import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from '#api/common.v2/infrastructure/AbstractController.js';
import { AIAssistantFactory } from '../AIAssistantFactory.js';
import { buildUwaziCredentials } from './buildUwaziCredentials.js';

type Dependencies = AbstractControllerDependencies<SendMessageRequestBody>;

const ContextChipSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.string(),
  removable: z.boolean().optional(),
});

const RequestSchema = z.object({
  message: z.string().trim().min(1),
  password: z.string().min(1),
  jobId: z.string().trim().min(1).optional(),
  context: z.object({
    mode: z.enum(['auto', 'this-document']),
    chips: z.array(ContextChipSchema),
  }),
});

type SendMessageRequestBody = z.infer<typeof RequestSchema>;

class SendAIAssistantMessageController extends AbstractController<SendMessageRequestBody> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);

    this.ensureUser();

    const cookies = cookie.parse(this.request.get('cookie') || '');
    const sessionId = cookies['connect.sid'];

    if (!sessionId) {
      this.clientError('Session not found');
      return;
    }

    const credentials = buildUwaziCredentials(this.request, dto.password);
    if (!credentials) {
      this.clientError('User username not found');
      return;
    }

    const useCase = AIAssistantFactory.createSendMessage();
    const result = await useCase.execute({
      tenantName: this.tenantName,
      userId: this.user._id,
      sessionId,
      message: dto.message,
      conversationJobId: dto.jobId,
      credentials,
    });

    this.response.status(202).json(result);
  }
}

export { SendAIAssistantMessageController };
