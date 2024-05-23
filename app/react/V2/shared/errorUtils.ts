const handledErrors: { [k: string]: RequestError } = {
  400: {
    name: 'Bad Request',
    message: 'The request could not be processed.',
    status: 400,
  },
  404: {
    name: 'Not Found',
    message: "We can't find the page you're looking for.",
    status: 404,
  },
  500: {
    name: 'Unexpected error',
    message: 'Something went wrong',
    status: 500,
  },
};

interface RequestError extends Error {
  status: number;
  message: string;
  name: string;
  requestId?: string;
  endpoint?: string;
  headers?: {};
  json?: { error?: string };
  additionalInfo?: { message: string; ok: boolean };
}

export { handledErrors };
export type { RequestError };
