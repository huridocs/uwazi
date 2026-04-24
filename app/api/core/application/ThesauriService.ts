import { Thesaurus } from '../domain/thesaurus/Thesaurus.js';
import { Dispatcher } from './contracts/Dispatcher.js';
import { ThesauriDataSource } from './contracts/ThesauriDataSource.js';
import { ThesaurusTranslationService } from './thesaurusTranslationService/ThesaurusTranslationService.js';

type Deps = {
  dispatcher: Dispatcher;
  thesauriDS: ThesauriDataSource;
  thesaurusTranslationService: ThesaurusTranslationService;
};

type UpdateContext = {
  tenantName: string;
  actorId: string;
};

class ThesauriService {
  constructor(private deps: Deps) {}

  private static shouldSkipUpdate(diff: ReturnType<Thesaurus['getDiff']>) {
    return !diff.hasChanges && !diff.hasOrderChanges;
  }

  private async persistOrderOnlyIfNeeded(
    thesaurus: Thesaurus,
    diff: ReturnType<Thesaurus['getDiff']>
  ) {
    if (!diff.hasChanges && diff.hasOrderChanges) {
      await this.deps.thesauriDS.update(thesaurus);
      return true;
    }

    return false;
  }

  private async validateNameIfChanged(
    thesaurus: Thesaurus,
    diff: ReturnType<Thesaurus['getDiff']>
  ) {
    if (diff.updatedName) {
      (await this.deps.thesauriDS.exists(thesaurus)).getDataOrThrow();
    }
  }

  async insert(thesaurus: Thesaurus): Promise<void> {
    (await this.deps.thesauriDS.exists(thesaurus)).getDataOrThrow();

    await this.deps.thesauriDS.create(thesaurus);
    await this.deps.thesaurusTranslationService.create(thesaurus);
  }

  async update(thesaurus: Thesaurus, context: UpdateContext): Promise<void> {
    const diff = thesaurus.getDiff();

    if (ThesauriService.shouldSkipUpdate(diff)) {
      return;
    }

    if (await this.persistOrderOnlyIfNeeded(thesaurus, diff)) {
      return;
    }

    await this.validateNameIfChanged(thesaurus, diff);

    await this.deps.thesauriDS.update(thesaurus);

    await this.deps.thesaurusTranslationService.update(diff);

    await this.deps.dispatcher.denormalizeThesaurus({
      tenantName: context.tenantName,
      thesaurusId: thesaurus.id,
      userId: context.actorId,
    });
  }
}

export { ThesauriService };
