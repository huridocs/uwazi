import { z } from 'zod';
import { tenants } from '#api/tenants/index.js';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from '#api/common.v2/infrastructure/AbstractController.js';
import { CancelAIAssistantConversationFactory } from './CancelAIAssistantConversationFactory.js';

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

    const useCase = CancelAIAssistantConversationFactory.createDefault();
    await useCase.execute({
      tenantName: this.tenantName,
      jobId: dto.jobId,
      credentials: {
        url: `${this.request.protocol}://${instanceHost}`,
        username,
        password: dto.password,
      },
    });

    this.response.status(204).send();
  }
}

export { CancelAIAssistantConversationController };
