import { AbstractUseCase } from '../libs/UseCase.js';
import {
  LocaleTranslationInput,
  prepareLocaleTranslation,
} from './translation/localeTranslationDto.js';
import { TranslationsQueryService } from './translation/TranslationsQueryService.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { PropagateThesaurusTranslationService } from './translation/PropagateThesaurusTranslationService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationType } from '#shared/translationType.js';

type Input = LocaleTranslationInput;

type Output = TranslationType;

type Deps = {
  translationsService: TranslationsService;
  query: TranslationsQueryService;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

class SaveLocaleTranslationsUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(translation: Input): Promise<Output> {
    const translationToSave = prepareLocaleTranslation(translation);
    const [currentTranslationData] = await this.deps.query.getLegacy({
      locale: translationToSave.locale as LanguageISO6391,
    });

    await this.transactionManager.run(async () => {
      await this.deps.translationsService.persistLocale(translationToSave);
    });

    await this.deps.propagateThesaurusTranslation.forLocale(
      translationToSave,
      currentTranslationData?.contexts || []
    );

    return translationToSave;
  }
}

export { SaveLocaleTranslationsUseCase };
export type { Input as SaveLocaleTranslationsInput };
