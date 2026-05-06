import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1CompatTenantDispatchable } from '#api/core/libs/queue/application/contracts/V1CompatTenantDispatchable.js';
import { TranslationService } from '#api/core/domain/template/TranslationService.js';

type Params = {
  languageKey: LanguageISO6391;
};

type JobDependencies = {
  translationService: TranslationService;
};

class ImportPredefinedTranslationsJob extends V1CompatTenantDispatchable<Params> {
  constructor(private deps: JobDependencies) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params): Promise<void> {
    try {
      await this.deps.translationService.importPredefined(params.languageKey);
    } catch (error) {
      if (!(error instanceof UITranslationNotAvailable)) throw error;
      // No predefined CSV for this locale — not an error
    }
  }
}

export { ImportPredefinedTranslationsJob };
