import { OptionalId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';
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
