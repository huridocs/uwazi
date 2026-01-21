import { Thesaurus } from '../domain/thesaurus/Thesaurus';
import { ThesauriDataSource } from './contracts/ThesauriDataSource';
import { ThesaurusTranslationService } from './thesaurusTranslationService/ThesaurusTranslationService';

type Deps = {
  thesauriDS: ThesauriDataSource;
  thesaurusTranslationService: ThesaurusTranslationService;
};

class ThesauriService {
  constructor(private deps: Deps) {}

  async insert(thesaurus: Thesaurus): Promise<void> {
    (await this.deps.thesauriDS.exists(thesaurus.name)).getDataOrThrow();

    await this.deps.thesauriDS.create(thesaurus);
    await this.deps.thesaurusTranslationService.create(thesaurus);
  }
}

export { ThesauriService };
