import { PropertyValueSchema } from '#shared/types/commonTypes.js';
import type { Entity } from './types.js';

const update = (
  entity: Entity,
  data?: {
    title?: Entity['title'];
    properties?: {
      [propertyName: string]: PropertyValueSchema | PropertyValueSchema[] | undefined;
    }[];
  }
): Entity => {
  const updatedEntity = { ...entity };

  if (!data) return entity;

  const { title, properties } = data;

  if (title) {
    updatedEntity.title = title;
  }

  if (properties?.length) {
    if (!updatedEntity.metadata) {
      updatedEntity.metadata = {};
    }

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
