import { AbstractUseCase } from '../libs/UseCase.js';
import {
  LocaleTranslationInput,
  flattenLocaleTranslation,
  toValueMap,
} from './translation/localeTranslationDto.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { PropagateThesaurusTranslationService } from './translation/PropagateThesaurusTranslationService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';
import { isTranslationContextType } from '../domain/translation/Translation.js';

type Input = LocaleTranslationInput;

type Output = LocaleTranslationInput;

type Deps = {
  translationsService: TranslationsService;
  translationsDS: TranslationsDataSource;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

class SaveLocaleTranslationsUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(translation: Input): Promise<Output> {
    const locale = translation.locale as LanguageISO6391 | undefined;
    if (!locale) {
      throw new Error('translation to save should have a locale');
    }

    const thesaurusContexts = (translation.contexts || []).filter(context => context.id);

    const snapshots = await Promise.all(
      thesaurusContexts.map(async context => {
        const rows = await this.deps.translationsDS.getByLanguageAndContext(locale, context.id!);
        const type = isTranslationContextType(context.type) ? context.type : rows[0]?.context.type;
        const label = context.label || rows[0]?.context.label;
        if (!type || !label) {
          throw new Error(
            `Cannot save translations for context "${context.id}" without type and label`
          );
        }
        return {
          contextId: context.id!,
          type,
          label,
          previous: toValueMap(rows),
          next: context.values || {},
        };
      })
    );

    const entries = flattenLocaleTranslation({
      ...translation,
      contexts: snapshots.map(snapshot => ({
        id: snapshot.contextId,
        type: snapshot.type,
        label: snapshot.label,
        values: snapshot.next,
      })),
    });

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
