import { OptionalId } from 'mongodb';

import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { Translation } from '../model/Translation';
import { TranslationDBO } from '../schemas/TranslationDBO';
import { TranslationSyO } from '../schemas/TranslationSyO';

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
