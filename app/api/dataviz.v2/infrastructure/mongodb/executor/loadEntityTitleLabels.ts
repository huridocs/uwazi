import type { Db } from 'mongodb';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { LocalizedLabels } from '#shared/types/datavizSchema.js';
import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';

export const loadEntityTitleLabels = async (
  db: Db,
  sharedIds: string[],
  languages: LanguageISO6391[]
): Promise<Map<string, LocalizedLabels>> => {
  const result = new Map<string, LocalizedLabels>();

  const filteredIds = sharedIds.filter(
    id => id && id !== DATAVIZ_MISSING_BUCKET_KEY && id !== 'null' && id !== 'undefined'
  );

  if (filteredIds.length === 0) {
    return result;
  }

  const entities = await db
    .collection<EntityDBO>('entities')
    .find(
      { sharedId: { $in: filteredIds }, language: { $in: languages } },
      { projection: { sharedId: 1, language: 1, title: 1 } }
    )
    .toArray();

  entities.forEach(entity => {
    if (!entity.sharedId || !entity.language) {
      return;
    }

    const labels = result.get(entity.sharedId) ?? {};
    labels[entity.language] = entity.title;
    result.set(entity.sharedId, labels);
  });

  return result;
};
