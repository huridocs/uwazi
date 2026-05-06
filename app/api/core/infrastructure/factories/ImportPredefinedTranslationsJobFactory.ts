import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService.js';
import { ImportPredefinedTranslationsJob } from '../jobs/ImportPredefinedTranslationsJob.js';

class ImportPredefinedTranslationsJobFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof ImportPredefinedTranslationsJob>[0]>
  ): ImportPredefinedTranslationsJob {
    return new ImportPredefinedTranslationsJob({
      translationService: new LegacyTranslationService(),
      ...overrides,
    });
  }
}

export { ImportPredefinedTranslationsJobFactory };
