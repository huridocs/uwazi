import superagent from 'superagent';
import { HttpClient } from '#api/common.v2/contracts/HttpClient.js';
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

    const response = await superagent.post(url).send({
      message: input.message,
      credentials: input.credentials,
    });

    const body = response.body as SubmitResponseDTO;

    if (!body?.job_id) {
      throw new Error('AI Assistant service did not return a job_id');
    }

    return { jobId: body.job_id };
  }

  async getJobStatus(jobId: string): Promise<PollResult> {
    const dto = await this.dependencies.httpClient.get<JobStatusResponseDTO>({
      url: `${this.dependencies.url}/api/v1/jobs/${jobId}`,
    });

    if (dto.status === 'completed') {
      return { status: 'completed', message: dto.result ?? '' };
    }

    if (dto.status === 'failed') {
      return { status: 'error', error: dto.result ?? 'AI Assistant request failed' };
    }

    const progress = dto.result?.trim();
    if (progress) {
      return { status: 'running', progress };
    }

    return { status: 'pending' };
  }

  async cancelJob(jobId: string, credentials: SubmitMessageInput['credentials']): Promise<void> {
    await superagent.delete(`${this.dependencies.url}/api/v1/jobs/${jobId}`).send({
      credentials,
    });
  }
}

export { ExternalAIAssistantService };
