/** A controller used a response feature that an in-process call cannot reproduce. */
class UnsupportedInSsrClientError extends Error {
  constructor(member: string) {
    super(`res.${member} is unsupported in SSR client`);
    this.name = 'UnsupportedInSsrClientError';
  }
}

export { UnsupportedInSsrClientError };
