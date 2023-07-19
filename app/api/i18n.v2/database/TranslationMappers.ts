import { OptionalId } from 'mongodb';
import { Translation } from '../model/Translation';
import { TranslationDBO } from '../schemas/TranslationDBO';

export const TranslationMappers = {
  toDBO(translation: Translation): OptionalId<TranslationDBO> {
    return {
      key: translation.key,
      value: translation.value,
      language: translation.language,
      context: translation.context,
    };
  },
  toModel(translation: TranslationDBO): Translation {
    return new Translation(
      translation.key,
      translation.value,
      translation.language,
      translation.context
    );
  },
};
