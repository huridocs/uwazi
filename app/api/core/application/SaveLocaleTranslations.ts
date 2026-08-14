import { AbstractUseCase } from '../libs/UseCase.js';
import {
  LocaleTranslationInput,
  flattenLocaleTranslation,
  toValueMap,
} from './translation/localeTranslationDto.js';
import { TranslationsQueryService } from './translation/TranslationsQueryService.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { PropagateThesaurusTranslationService } from './translation/PropagateThesaurusTranslationService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type Input = LocaleTranslationInput;

type Output = LocaleTranslationInput;

type Deps = {
  translationsService: TranslationsService;
  query: TranslationsQueryService;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

class SaveLocaleTranslationsUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(translation: Input): Promise<Output> {
    const locale = translation.locale as LanguageISO6391 | undefined;
    if (!locale) {
      throw new Error('translation to save should have a locale');
    }

    const entries = flattenLocaleTranslation(translation);
    const thesaurusContexts = (translation.contexts || []).filter(context => context.id);

    const snapshots = await Promise.all(
      thesaurusContexts.map(async context => {
        const rows = await this.deps.query.getByLanguageAndContext(locale, context.id!).all();
        const type = context.type || rows[0]?.context.type;
        return {
          contextId: context.id!,
          type,
          previous: toValueMap(rows),
          next: context.values || {},
        };
      })
    );

    await this.transactionManager.run(async () => {
      await this.deps.translationsService.saveEntries(entries);
    });

    await Promise.all(
      snapshots.map(async snapshot =>
        this.deps.propagateThesaurusTranslation.propagate({
          locale,
          contextId: snapshot.contextId,
          type: snapshot.type,
          previous: snapshot.previous,
          next: snapshot.next,
        })
      )
    );

    return translation;
  }
}

export { SaveLocaleTranslationsUseCase };
export type { Input as SaveLocaleTranslationsInput };
