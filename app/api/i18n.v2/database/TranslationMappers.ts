import { ObjectId } from 'mongodb';
import { Translation } from '../model/Translation';
import { TranslationDBO } from '../schemas/TranslationDBO';

export const TranslationMappers = {
  toDBO(translation: Translation): TranslationDBO {
    return {
      _id: new ObjectId(translation._id),
      key: translation.key,
      value: translation.value,
      language: translation.language,
      context: translation.context,
    };
  },
  toModel(translation: TranslationDBO): Translation {
    return new Translation(
      translation._id.toString(),
      translation.key,
      translation.value,
      translation.language,
      translation.context
    );
  },
};
