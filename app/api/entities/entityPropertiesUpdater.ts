import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { generateID } from 'shared/IDGenerator';
import { propertyTypes } from 'shared/propertyTypes';
import model from './entitiesModel';

const updateRecursively = async (
  templateId: ObjectIdSchema,
  generatedIdProperties: PropertySchema[],
  searchQuery: {}
): Promise<void> => {
  const batchSize = 1000;
  const sharedIds = (
    await model.db.aggregate([
      { $match: { $and: [{ template: templateId }, { ...searchQuery }] } },
      { $group: { _id: '$sharedId' } },
      { $limit: batchSize },
    ])
  ).map(g => g._id);

  await Promise.all(
    sharedIds.map(async (sharedId: string) =>
      model.updateMany(
        {
          sharedId,
        },
        {
          ...generatedIdProperties.reduce(
            (values, property: PropertySchema) => ({
              ...{ ...values, [`metadata.${property.name}`]: [{ value: generateID(3, 4, 4) }] },
            }),
            {}
          ),
        }
      )
    )
  );
  if (sharedIds.length === batchSize) {
    return updateRecursively(templateId, generatedIdProperties, searchQuery);
  }
  return Promise.resolve();
};

const populateGeneratedIdByTemplate = async (
  templateId: ObjectIdSchema,
  properties: PropertySchema[]
): Promise<void> => {
  const generatedIdProperties = properties.filter(prop => prop.type === propertyTypes.generatedid);
  const searchQuery = generatedIdProperties.reduce(
    (values, property: PropertySchema) => ({
      ...{ ...values, [`metadata.${property.name}`]: { $exists: false } },
    }),
    {}
  );
  return updateRecursively(templateId, generatedIdProperties, searchQuery);
};

export { populateGeneratedIdByTemplate };
