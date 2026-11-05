import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { tenants } from '#api/tenants/index.js';
import type { UwaziCredentials } from '../../application/contracts/AIAssistantContracts.js';
import type { SendAIAssistantMessageInput } from '../../application/SendAIAssistantMessage.js';
import { AIAssistantFactory } from '../AIAssistantFactory.js';
import { buildUwaziCredentials } from './buildUwaziCredentials.js';

const ContextChipSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.string(),
  removable: z.boolean().optional(),
});

const RequestSchema = z.object({
  message: z.string().trim().min(1),
  password: z.string().min(1).optional(),
  jobId: z.string().trim().min(1).optional(),
  context: z
    .object({
      mode: z.enum(['auto', 'this-document']),
      chips: z.array(ContextChipSchema),
    })
    .optional(),
});

type SendMessageRequestBody = z.infer<typeof RequestSchema>;

type PreparedSend = {
  dto: SendMessageRequestBody;
  credentials?: UwaziCredentials;
  sessionId: string;
};

class SendAIAssistantMessageController extends AbstractController<SendMessageRequestBody> {
  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);
    this.ensureUser();
    const prepared = await this.prepare(dto);
    if (!prepared) {
      return;
    }
    await this.dispatch(prepared);
  }

  private async prepare(dto: SendMessageRequestBody): Promise<PreparedSend | undefined> {
    if (!ExecutionContext.sessionId) {
      this.clientError('Session not found');
      return undefined;
    }

    const settings = await AIAssistantFactory.createGetSettings().execute({
      includeSecrets: false,
    });
    const credentials = this.credentialsFor(dto, settings.requiresPassword);
    if (credentials === false) {
      return undefined;
    }

    return { dto, credentials, sessionId: ExecutionContext.sessionId };
  }

  private credentialsFor(
    dto: SendMessageRequestBody,
    requiresPassword: boolean
  ): UwaziCredentials | undefined | false {
    if (!requiresPassword) {
      return undefined;
    }
    if (!dto.password) {
      this.clientError('Password is required for Bert');
      return false;
    }
    const credentials = buildUwaziCredentials(this.request, dto.password);
    if (!credentials) {
      this.clientError('User username not found');
      return false;
    }
    return credentials;
  }

  private async dispatch(prepared: PreparedSend): Promise<void> {
    const result = await AIAssistantFactory.createSendMessage().execute(this.toInput(prepared));
    this.response.status(202).json(result);
  }

  private toInput(prepared: PreparedSend): SendAIAssistantMessageInput {
    return {
      tenantName: this.tenantName,
      userId: this.user._id,
      message: prepared.dto.message,
      conversationJobId: prepared.dto.jobId,
      credentials: prepared.credentials,
      context: prepared.dto.context,
      actor: this.user,
      language: this.language,
      sessionId: prepared.sessionId,
      protocol: this.request.protocol,
      instanceHost: tenants.current().domain || this.request.get('host') || '',
    };
  }
}

export { SendAIAssistantMessageController };
