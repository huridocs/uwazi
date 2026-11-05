import superagent from 'superagent';

type PostJsonInput = {
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

type JsonPoster = (input: PostJsonInput) => Promise<unknown>;

const postJson: JsonPoster = async input => {
  const request = superagent.post(input.url).send(input.body as object);
  Object.entries(input.headers ?? {}).forEach(([key, value]) => {
    request.set(key, value);
  });
  if (input.timeoutMs !== undefined) {
    request.timeout(input.timeoutMs);
  }
  const response = await request;
  return response.body;
};

const trimSlash = (value: string) => value.replace(/\/+$/, '');

export { postJson, trimSlash };
export type { JsonPoster, PostJsonInput };
