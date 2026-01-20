import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { ResultType } from '#api/core/libs/Result.js';

export interface ThesauriDataSource {
  exists(name: string): Promise<ResultType<false, Error>>;
  create(thesaurus: Thesaurus): Promise<void>;
}
