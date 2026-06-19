import { RequestParams } from '#app/utils/RequestParams.js';
import { api } from '#app/utils/api.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { ApiResponse } from '../ApiResponse.js';

type SendMessageInput = {
  message: string;
  password: string;
  jobId?: string;
};

type SendMessageResponse = {
  jobId: string;
};

const sendMessage = async (
  input: SendMessageInput
): Promise<ApiResponse<SendMessageResponse | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams({
      message: input.message,
      password: input.password,
      ...(input.jobId ? { jobId: input.jobId } : {}),
      // Context bar is UI-only for now; send empty payload until wired end-to-end.
      context: { mode: 'auto', chips: [] },
    });
    const response = await api.post('aiAssistant/messages', requestParams);
    return [response.json as SendMessageResponse, undefined];
  } catch (error) {
    return [undefined, error as FetchResponseError];
  }
};

export { sendMessage };
export type { SendMessageInput, SendMessageResponse };
