import { PollAIAssistantRequest } from '../../application/PollAIAssistantRequest.js';
import type { AIAssistantService } from '../../domain/AIAssistantService.js';

describe('PollAIAssistantRequest', () => {
  it('should return the poll result from the service', async () => {
    const aiAssistantService: AIAssistantService = {
      submitMessage: jest.fn(),
      getJobStatus: jest.fn().mockResolvedValue({
        status: 'completed',
        message: 'Done',
      }),
      cancelJob: jest.fn(),
    };

    const useCase = new PollAIAssistantRequest({ aiAssistantService });
    const result = await useCase.execute({ jobId: 'job-1' });

    expect(result).toEqual({ status: 'completed', message: 'Done' });
    expect(aiAssistantService.getJobStatus).toHaveBeenCalledWith('job-1');
  });
});
