import { Thesaurus } from '../domain/thesaurus/Thesaurus';
import { DenormalizeThesaurusEntitiesHandler } from '../infrastructure/jobs/DenormalizeThesaurusEntitiesHandler';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher';
import { ThesauriDataSource } from './contracts/ThesauriDataSource';
import { ThesaurusTranslationService } from './thesaurusTranslationService/ThesaurusTranslationService';

type Deps = {
  jobsDispatcher: JobsDispatcher;
  thesauriDS: ThesauriDataSource;
  thesaurusTranslationService: ThesaurusTranslationService;
};

type UpsertContext = {
  tenantName: string;
  actorId: string;
};

class ThesauriService {
  constructor(private deps: Deps) {}

  async insert(thesaurus: Thesaurus): Promise<void> {
    (await this.deps.thesauriDS.exists(thesaurus)).getDataOrThrow();

    await this.deps.thesauriDS.create(thesaurus);
    await this.deps.thesaurusTranslationService.create(thesaurus);
  }

  async upsert(thesaurus: Thesaurus, context: UpsertContext): Promise<void> {
    const diff = thesaurus.getDiff();

    if (!diff.hasChanges) {
      return;
    }

    if (diff.updatedName) {
      (await this.deps.thesauriDS.exists(thesaurus)).getDataOrThrow();
    }

    await this.deps.thesauriDS.update(thesaurus);

    await this.deps.thesaurusTranslationService.update(diff);

    await this.deps.jobsDispatcher.deleteByParams(DenormalizeThesaurusEntitiesHandler, {
      thesaurusId: thesaurus.id,
    });

    await this.deps.jobsDispatcher.dispatch(DenormalizeThesaurusEntitiesHandler, {
      tenantName: context.tenantName,
      thesaurusId: thesaurus.id,
      userId: context.actorId,
    });
  }
}

export { ThesauriService };
