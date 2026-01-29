import { ThesaurusNotFoundError } from 'api/core/domain/thesaurus/errors';
import { Thesaurus } from 'api/core/domain/thesaurus/Thesaurus';
import { ResultType } from 'api/core/libs/Result';

export interface ThesauriDataSource {
  getById(id: string): Promise<ResultType<Thesaurus, ThesaurusNotFoundError>>;
  exists(thesaurus: Thesaurus): Promise<ResultType<false, Error>>;
  create(thesaurus: Thesaurus): Promise<void>;
  update(thesaurus: Thesaurus): Promise<void>;
}
