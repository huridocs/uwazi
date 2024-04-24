import { PropertyValueSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';

const update = (
  entity: EntitySchema,
  data?: {
    title?: EntitySchema['title'];
    properties?: {
      [propertyName: string]: PropertyValueSchema | PropertyValueSchema[] | undefined;
    }[];
  }
): EntitySchema => {
  const updatedEntity = { ...entity };

  if (!data) return entity;

  const { title, properties } = data;

  if (title) {
    updatedEntity.title = title;
  }

  if (properties?.length) {
    properties.forEach(property => {
      const [propertyName] = Object.keys(property);
      const propertyValue = property[propertyName];

      if (!propertyValue) {
        delete updatedEntity.metadata![propertyName];
        return;
      }

      if (!Array.isArray(propertyValue)) {
        updatedEntity.metadata![propertyName] = [{ value: propertyValue! }];
      }

      if (Array.isArray(propertyValue)) {
        updatedEntity.metadata![propertyName] = propertyValue.map(value => ({ value }));
      }
    });
  }

  return updatedEntity;
};

export { update };
