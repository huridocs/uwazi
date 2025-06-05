// eslint-disable-next-line max-classes-per-file
export class QueueWorkerError extends Error {}

export class UnregisteredJobError extends QueueWorkerError {}

export class NonRetryableJobError extends QueueWorkerError {
  constructor(error: Error) {
    super(error.message, { cause: error });
    this.name = 'NonRetryableError';
  }
}
