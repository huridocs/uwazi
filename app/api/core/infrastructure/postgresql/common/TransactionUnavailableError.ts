/** A statement reached a transaction that cannot take it. */
class TransactionUnavailableError extends Error {
  private constructor(message: string) {
    super(message);
    this.name = 'TransactionUnavailableError';
  }

  static closed(): TransactionUnavailableError {
    return new TransactionUnavailableError(
      'The transaction is closed: it has committed or rolled back'
    );
  }

  static streaming(): TransactionUnavailableError {
    return new TransactionUnavailableError(
      'Cannot send statements on a transaction while one of its streams is open'
    );
  }
}

export { TransactionUnavailableError };
