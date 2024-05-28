const HTTPResponses = {
  Informational: 'Informational',
  Successful: 'Successful',
  Redirection: 'Redirection',
  ClientError: 'ClientError',
  ServerError: 'ServerError',
} as const;

type HTTPResponseType = (typeof HTTPResponses)[keyof typeof HTTPResponses];

const getResponseType = (code: number) => {
  switch (true) {
    case code >= 100 && code < 200:
      return HTTPResponses.Informational;
    case code >= 200 && code < 300:
      return HTTPResponses.Successful;
    case code >= 300 && code < 400:
      return HTTPResponses.Redirection;
    case code >= 400 && code < 500:
      return HTTPResponses.ClientError;
    default:
      return HTTPResponses.ServerError;
  }
};

export type { HTTPResponseType };
export { HTTPResponses, getResponseType };
