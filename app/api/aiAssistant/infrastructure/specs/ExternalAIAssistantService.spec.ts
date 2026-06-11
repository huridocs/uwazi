import express from 'express';
import { Server } from 'http';
import superagent from 'superagent';
import type { HttpClient } from '#api/common.v2/contracts/HttpClient.js';
import { ExternalAIAssistantService } from '../ExternalAIAssistantService.js';

const app = express();
let server: Server;
const jobs = new Map<string, { message: string; pollCount: number }>();

app.use(express.json());

app.post('/api/v1/jobs', (req, res) => {
  const jobId = `job-${jobs.size + 1}`;
  jobs.set(jobId, {
    message: req.body.message,
    pollCount: 0,
  });
  res.status(200).json({ job_id: jobId, message: req.body.message, status: 'pending' });
});

app.post('/api/v1/jobs/:jobId', (req, res) => {
  const jobData = jobs.get(req.params.jobId);
  if (!jobData) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  jobData.message = req.body.message;
  jobData.pollCount = 0;
  res.status(200).json({
    job_id: req.params.jobId,
    message: req.body.message,
    status: 'pending',
  });
});

app.delete('/api/v1/jobs/:jobId', (req, res) => {
  jobs.delete(req.params.jobId);
  res.status(204).send();
});

app.get('/api/v1/jobs/:jobId', (req, res) => {
  if (req.params.jobId === 'running-with-progress') {
    res.status(200).json({
      job_id: req.params.jobId,
      status: 'running',
      result: 'get thesauris names...',
    });
    return;
  }

  const jobData = jobs.get(req.params.jobId);
  if (!jobData) {
    res.status(200).json({ job_id: req.params.jobId, status: 'failed', result: null });
    return;
  }

  jobData.pollCount += 1;

  if (jobData.pollCount === 1) {
    res.status(200).json({ job_id: req.params.jobId, status: 'running', result: null });
    return;
  }

  res.status(200).json({
    job_id: req.params.jobId,
    status: 'completed',
    result: `Reply to: ${jobData.message}`,
  });
});

describe('ExternalAIAssistantService', () => {
  const httpClient: HttpClient = {
    async get<Response>(input) {
      const response = await superagent.get(input.url);
      return response.body as Response;
    },
    postFormData: jest.fn(),
  };

  beforeAll(async () => {
    await new Promise<void>(resolve => {
      server = app.listen(5054, resolve);
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  it('should submit a message and poll its status', async () => {
    const service = new ExternalAIAssistantService({
      url: 'http://localhost:5054',
      httpClient,
    });

    const { jobId } = await service.submitMessage({
      message: 'Hello',
      credentials: {
        url: 'http://localhost:3000',
        username: 'admin',
        password: 'secret',
      },
    });

    const pending = await service.getJobStatus(jobId);
    expect(pending).toEqual({ status: 'pending' });

    const result = await service.getJobStatus(jobId);

    expect(result).toEqual({
      status: 'completed',
      message: 'Reply to: Hello',
    });
  });

  it('should map running jobs with a result to progress updates', async () => {
    const service = new ExternalAIAssistantService({
      url: 'http://localhost:5054',
      httpClient,
    });

    const progress = await service.getJobStatus('running-with-progress');

    expect(progress).toEqual({
      status: 'running',
      progress: 'get thesauris names...',
    });
  });

  it('should continue an existing conversation on POST /api/v1/jobs/:jobId', async () => {
    const service = new ExternalAIAssistantService({
      url: 'http://localhost:5054',
      httpClient,
    });

    const { jobId } = await service.submitMessage({
      message: 'First message',
      credentials: {
        url: 'http://localhost:3000',
        username: 'admin',
        password: 'secret',
      },
    });

    const continued = await service.submitMessage({
      message: 'Follow-up message',
      jobId,
      credentials: {
        url: 'http://localhost:3000',
        username: 'admin',
        password: 'secret',
      },
    });

    expect(continued).toEqual({ jobId });

    const result = await service.getJobStatus(jobId);
    expect(result).toEqual({ status: 'pending' });

    const completed = await service.getJobStatus(jobId);
    expect(completed).toEqual({
      status: 'completed',
      message: 'Reply to: Follow-up message',
    });
  });

  it('should cancel a job on DELETE /api/v1/jobs/:jobId', async () => {
    const service = new ExternalAIAssistantService({
      url: 'http://localhost:5054',
      httpClient,
    });

    const { jobId } = await service.submitMessage({
      message: 'Cancel me',
      credentials: {
        url: 'http://localhost:3000',
        username: 'admin',
        password: 'secret',
      },
    });

    await service.cancelJob(jobId, {
      url: 'http://localhost:3000',
      username: 'admin',
      password: 'secret',
    });

    const result = await service.getJobStatus(jobId);
    expect(result).toEqual({
      status: 'error',
      error: 'AI Assistant request failed',
    });
  });

  it('should map failed jobs to error results', async () => {
    const service = new ExternalAIAssistantService({
      url: 'http://localhost:5054',
      httpClient,
    });

    const result = await service.getJobStatus('unknown-job');

    expect(result).toEqual({
      status: 'error',
      error: 'AI Assistant request failed',
    });
  });
});
