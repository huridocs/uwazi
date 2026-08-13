import { OptionalId } from 'mongodb';

import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { TranslationDBO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationDBO.js';
import { TranslationSyO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationSyO.js';

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
      translation.value ?? '',
      translation.language,
      translation.context
    );
  },
  fromSyncToDBO(translation: TranslationSyO): TranslationDBO {
    return {
      _id: MongoIdHandler.mapToDb(translation._id),
      key: translation.key,
      value: translation.value,
      language: translation.language,
      context: translation.context,
    };
  },
};
