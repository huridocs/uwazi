import * as cookie from 'cookie';
import { z } from 'zod';
import { tenants } from '#api/tenants/index.js';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from '#api/common.v2/infrastructure/AbstractController.js';
import { SendAIAssistantMessageFactory } from './SendAIAssistantMessageFactory.js';

type Dependencies = AbstractControllerDependencies<Request>;

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

type Request = z.infer<typeof RequestSchema>;

class SendAIAssistantMessageController extends AbstractController<Request> {
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

    const username = this.request.user?.username;
    if (!username) {
      this.clientError('User username not found');
      return;
    }

    const tenant = tenants.current();
    const instanceHost = tenant.domain || this.request.get('host');
    if (!instanceHost) {
      this.clientError('Tenant domain not found');
      return;
    }

    const useCase = SendAIAssistantMessageFactory.createDefault();
    const result = await useCase.execute({
      tenantName: this.tenantName,
      userId: this.user._id,
      sessionId,
      message: dto.message,
      conversationJobId: dto.jobId,
      context: {
        mode: dto.context.mode,
        chips: dto.context.chips.map(chip => ({
          id: chip.id,
          label: chip.label,
          kind: chip.kind,
        })),
      },
      credentials: {
        url: `${this.request.protocol}://${instanceHost}`,
        username,
        password: dto.password,
      },
    });

    this.response.status(202).json(result);
  }
}

export { SendAIAssistantMessageController };
