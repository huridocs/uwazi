import superagent from 'superagent';
import { HttpClient } from '#api/common.v2/contracts/HttpClient.js';
import { aiAssistantLog } from './aiAssistantLog.js';
import type { AIAssistantService } from '../domain/AIAssistantService.js';
import type {
  PollResult,
  SubmitMessageInput,
  SubmitMessageOutput,
} from '../domain/AIAssistantTypes.js';

type JobStatusResponseDTO = {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
};

type SubmitResponseDTO = {
  job_id: string;
  message: string;
  status: string;
};

type Dependencies = {
  url: string;
  httpClient: HttpClient;
};

class ExternalAIAssistantService implements AIAssistantService {
  constructor(private dependencies: Dependencies) {}

  async submitMessage(input: SubmitMessageInput): Promise<SubmitMessageOutput> {
    const url = input.jobId
      ? `${this.dependencies.url}/api/v1/jobs/${input.jobId}`
      : `${this.dependencies.url}/api/v1/jobs`;

    aiAssistantLog('external.submit.start', {
      url,
      baseUrl: this.dependencies.url,
      continueConversation: Boolean(input.jobId),
      messageLength: input.message.length,
    });

    try {
      const response = await superagent.post(url).send({
        message: input.message,
        credentials: input.credentials,
      });

      const body = response.body as SubmitResponseDTO;

      aiAssistantLog('external.submit.response', {
        url,
        status: response.status,
        jobId: body?.job_id,
        remoteStatus: body?.status,
      });

      if (!body?.job_id) {
        throw new Error('AI Assistant service did not return a job_id');
      }

      return { jobId: body.job_id };
    } catch (error) {
      aiAssistantLog('external.submit.error', {
        url,
        baseUrl: this.dependencies.url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<PollResult> {
    const url = `${this.dependencies.url}/api/v1/jobs/${jobId}`;

    try {
      const dto = await this.dependencies.httpClient.get<JobStatusResponseDTO>({ url });

      let mapped: PollResult;
      if (dto.status === 'completed') {
        mapped = { status: 'completed', message: dto.result ?? '' };
      } else if (dto.status === 'failed') {
        mapped = { status: 'error', error: dto.result ?? 'AI Assistant request failed' };
      } else {
        const progress = dto.result?.trim();
        mapped = progress ? { status: 'running', progress } : { status: 'pending' };
      }

      aiAssistantLog('external.poll.response', {
        url,
        jobId,
        remoteStatus: dto.status,
        mappedStatus: mapped.status,
        resultLength: dto.result?.length ?? 0,
      });

      return mapped;
    } catch (error) {
      aiAssistantLog('external.poll.error', {
        url,
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async cancelJob(jobId: string, credentials: SubmitMessageInput['credentials']): Promise<void> {
    const url = `${this.dependencies.url}/api/v1/jobs/${jobId}`;

    aiAssistantLog('external.cancel.start', { url, jobId });

    try {
      const response = await superagent.delete(url).send({ credentials });
      aiAssistantLog('external.cancel.response', { url, jobId, status: response.status });
    } catch (error) {
      aiAssistantLog('external.cancel.error', {
        url,
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export { ExternalAIAssistantService };
