import { NotFoundError } from '#api/core/domain/error/NotFoundError.js';

export class BlankStateEmptyError extends NotFoundError {
  constructor() {
    super('No blank-state data to restore.', 'blank_state.empty');
  }
}
