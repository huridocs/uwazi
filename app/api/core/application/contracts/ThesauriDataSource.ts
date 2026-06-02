import { ThesaurusNotFoundError } from '#api/core/domain/thesaurus/errors.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { ResultType } from '#api/core/libs/Result.js';

export interface ThesauriDataSource {
  getById(id: string): Promise<ResultType<Thesaurus, ThesaurusNotFoundError>>;
  exists(thesaurus: Thesaurus): Promise<ResultType<false, Error>>;
  existsById(id: string): Promise<boolean>;
  create(thesaurus: Thesaurus): Promise<void>;
  update(thesaurus: Thesaurus): Promise<void>;
}
