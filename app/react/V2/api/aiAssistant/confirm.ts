import { RequestParams } from '#app/utils/RequestParams.js';
import { api } from '#app/utils/api.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { ApiResponse } from '../ApiResponse.js';

type ConfirmDecision = 'yes' | 'yes_dont_ask' | 'no';

type ConfirmToolInput = {
  jobId: string;
  toolCallId: string;
  decision: ConfirmDecision;
};

const confirmTool = async (
  input: ConfirmToolInput
): Promise<ApiResponse<{ ok: true } | undefined, FetchResponseError>> => {
  try {
    const response = await api.post('aiAssistant/confirm', new RequestParams(input));
    return [response.json as { ok: true }, undefined];
  } catch (error) {
    return [undefined, error as FetchResponseError];
  }
};

const clearConversation = async (
  jobId: string
): Promise<ApiResponse<{ ok: true } | undefined, FetchResponseError>> => {
  try {
    const response = await api.post(
      'aiAssistant/conversations/clear',
      new RequestParams({ jobId })
    );
    return [response.json as { ok: true }, undefined];
  } catch (error) {
    return [undefined, error as FetchResponseError];
  }
};

export { clearConversation, confirmTool };
export type { ConfirmDecision, ConfirmToolInput };
