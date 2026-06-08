import { RequestParams } from '#app/utils/RequestParams.js';
import { api } from '#app/utils/api.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import type { ContextChip, ContextScopeMode } from '#V2/Components/AIAssistant/types.js';
import { ApiResponse } from '../ApiResponse.js';

type SendMessageInput = {
  message: string;
  password: string;
  context: {
    mode: ContextScopeMode;
    chips: ContextChip[];
  };
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
      context: {
        mode: input.context.mode,
        chips: input.context.chips.map(chip => ({
          id: chip.id,
          label: chip.label,
          kind: chip.kind,
          removable: chip.removable,
        })),
      },
    });
    const response = await api.post('aiAssistant/messages', requestParams);
    return [response.json as SendMessageResponse, undefined];
  } catch (error) {
    return [undefined, error as FetchResponseError];
  }
};

export { sendMessage };
export type { SendMessageInput, SendMessageResponse };
