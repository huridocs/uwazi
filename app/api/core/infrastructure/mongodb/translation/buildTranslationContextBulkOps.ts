import { AnyBulkWriteOperation, OptionalId } from 'mongodb';
import { TranslationContextModel } from '#api/core/domain/translation/TranslationContextModel.js';
import { TranslationMappers } from './mappings/TranslationMappers.js';
import { TranslationDBO } from './schemas/TranslationDBO.js';

export function buildTranslationContextBulkOps(
  context: TranslationContextModel
): AnyBulkWriteOperation<OptionalId<TranslationDBO>>[] {
  const diff = context.getDiff();
  if (!diff.hasChanges()) {
    return [];
  }

  const bulkOps: AnyBulkWriteOperation<OptionalId<TranslationDBO>>[] = [];
  const contextInfo = context.getContextInfo();

  if (diff.contextLabelChanged) {
    bulkOps.push({
      updateMany: {
        filter: { 'context.id': contextInfo.id },
        update: { $set: { 'context.label': contextInfo.label } },
      },
    });
  }

  diff.addedTranslations.forEach(translation => {
    bulkOps.push({
      insertOne: {
        document: TranslationMappers.toDBO(translation),
      },
    });
  });

  diff.updatedTranslations.forEach(translation => {
    bulkOps.push({
      updateOne: {
        filter: {
          'context.id': translation.context.id,
          key: translation.key,
          language: translation.language,
        },
        update: { $set: TranslationMappers.toDBO(translation) },
      },
    });
  });

  if (diff.deletedKeys.length > 0) {
    bulkOps.push({
      deleteMany: {
        filter: {
          'context.id': contextInfo.id,
          key: { $in: diff.deletedKeys },
        },
      },
    });
  }

  return bulkOps;
}
