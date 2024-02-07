class TypeParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TypeParserError';
  }
}

export { TypeParserError };
