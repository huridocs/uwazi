import entities from 'api/entities/entities';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { generateID } from 'shared/IDGenerator';
import model from './entitiesModel';

const populateGeneratedIdBTemplate = async (templateId: ObjectIdSchema) => {
  const entitiesToUpdate = await entities.get({ template: templateId }, 'sharedId');
  const sharedIds = entitiesToUpdate.map(({ sharedId }) => sharedId);

  const data = await model.get({ sharedId: { $in: sharedIds } });
  await Promise.all(
    data.map(async (d: any) =>
      model.updateMany({ sharedId: d.sharedId }, { 'metadata.autoId.value': generateID(3, 4, 4) })
    )
  );
  console.log(data);
};

export { populateGeneratedIdBTemplate };
