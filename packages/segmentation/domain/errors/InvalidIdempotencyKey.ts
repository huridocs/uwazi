import { DomainError } from '#api/core/domain/error/DomainError.js';

class InvalidIdempotencyKey extends DomainError {
  static readonly category = 'validation';

  constructor(raw: string) {
    super(
      `"${raw}" is not a valid segmentation idempotency key`,
      'segmentation.invalid_idempotency_key'
    );
  }
}

export { InvalidIdempotencyKey };
