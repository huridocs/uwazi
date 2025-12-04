import { Thesaurus } from 'api/core/domain/thesaurus/Thesaurus';
import { ResultType } from 'api/core/libs/Result';

export interface ThesauriDataSource {
  exists(name: string): Promise<ResultType<false, Error>>;
  create(thesaurus: Thesaurus): Promise<void>;
}
