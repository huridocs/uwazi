import { FetchResponseError } from '#shared/JSONRequest.js';

const DATAVIZ_DUPLICATE_NAME_CODE = 'DATAVIZ_DUPLICATE_NAME';

type FetchResponseErrorBody = {
  json?: {
    code?: string;
  };
};

const isDatavizDuplicateNameError = (error: unknown): boolean => {
  if (!(error instanceof FetchResponseError)) {
    return false;
  }

  return (error as FetchResponseErrorBody).json?.code === DATAVIZ_DUPLICATE_NAME_CODE;
};

export { DATAVIZ_DUPLICATE_NAME_CODE, isDatavizDuplicateNameError };
