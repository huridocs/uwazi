import { ObjectIdSchema } from 'shared/types/commonTypes';
import { generateID } from 'shared/IDGenerator';

import model from './entitiesModel';

const populateGeneratedIdBTemplate = async (templateId: ObjectIdSchema): Promise<any> => {
  const batchSize = 1000;
  const sharedIds = (
    await model.db.aggregate([
      { $match: { $and: [{ template: templateId }, { 'metadata.autoId': { $exists: false } }] } },
      { $group: { _id: '$sharedId' } },
      { $limit: batchSize },
    ])
  ).map(g => g._id);
  await Promise.all(
    sharedIds.map(async (sharedId: any) =>
      model.updateMany({ sharedId }, { 'metadata.autoId': [{ value: generateID(3, 4, 4) }] })
    )
  );
  if (sharedIds.length >= batchSize) {
    return populateGeneratedIdBTemplate(templateId);
  }
  return Promise.resolve();
};

export { populateGeneratedIdBTemplate };
