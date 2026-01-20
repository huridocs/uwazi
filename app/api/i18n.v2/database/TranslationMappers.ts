import { OptionalId } from 'mongodb';

import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';
import { TranslationDBO } from '#api/i18n.v2/schemas/TranslationDBO.js';
import { TranslationSyO } from '#api/i18n.v2/schemas/TranslationSyO.js';

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
