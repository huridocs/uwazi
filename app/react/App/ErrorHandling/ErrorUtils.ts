export interface RequestError extends Error {
  title?: string;
  summary?: string;
  requestId?: string;
  code?: string;
}

export interface APIError {
  json: {
    error?: string;
    prettyMessage: string;
    requestId?: number;
  };
  status?: number;
}

export const getRenderError = (apiResponse: APIError) => {
  if (!apiResponse || !apiResponse.json) {
    return {};
  }
  return apiResponse
    ? {
        name: apiResponse.json.error || 'Unexpected error',
        message: apiResponse.json.prettyMessage,
        requestId: apiResponse.json.requestId,
        code: apiResponse.status,
      }
    : null;
};
