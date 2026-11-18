/** A server-side API call answered with a non-2xx status. */
class ServerApiError extends Error {
  readonly status: number;

  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ServerApiError';
    this.status = status;
    this.body = body;
  }
}

export { ServerApiError };
