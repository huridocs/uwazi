import { RequestParams } from '#app/utils/RequestParams.js';
import { api } from '#app/utils/api.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { ApiResponse } from '../ApiResponse.js';

type CancelConversationInput = {
  jobId: string;
  password: string;
};

const cancelConversation = async (
  input: CancelConversationInput
): Promise<ApiResponse<void, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams({
      jobId: input.jobId,
      password: input.password,
    });
    await api.post('aiAssistant/conversation/cancel', requestParams);
    return [undefined, undefined];
  } catch (error) {
    return [undefined, error as FetchResponseError];
  }
};

export { cancelConversation };
export type { CancelConversationInput };
