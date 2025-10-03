import { DomainError } from '../error/DomainError';

export class ThesaurusNotFoundError extends DomainError {
  constructor(thesaurusId: string) {
    super(
      `The Thesaurus with Id "${thesaurusId}" was not found`,
      'thesaurus.thesaurus_not_found_error'
    );
  }
}
