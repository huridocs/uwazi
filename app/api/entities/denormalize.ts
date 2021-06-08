import { EntitySchema } from 'shared/types/entityType';
import { PropertySchema } from 'shared/types/commonTypes';
import model from './entitiesModel';

interface Changes {
  label: string;
  icon?: EntitySchema['icon'];
}

interface Params {
  id: string;
  language: string;
}

export const updateTransitiveDenormalization = async (
  { id, language }: Params,
  changes: Changes,
  properties: PropertySchema[]
) =>
  Promise.all(
    properties.map(async property =>
      model.updateMany(
        { language, [`metadata.${property.name}.inheritedValue.value`]: id },
        {
          ...(changes.icon
            ? { [`metadata.${property.name}.$.inheritedValue.$[valueObject].icon`]: changes.icon }
            : {}),
          [`metadata.${property.name}.$.inheritedValue.$[valueObject].label`]: changes.label,
        },
        { arrayFilters: [{ 'valueObject.value': id }] }
      )
    )
  );

export const updateDenormalization = async (
  { id, language }: Params,
  changes: Changes,
  properties: PropertySchema[]
) =>
  Promise.all(
    properties.map(async property =>
      model.updateMany(
        { language, [`metadata.${property.name}.value`]: id },
        {
          $set: Object.keys(changes).reduce(
            (set, prop) => ({
              ...set,
              [`metadata.${property.name}.$[valueObject].${prop}`]: changes[<keyof Changes>prop],
            }),
            {}
          ),
        },
        { arrayFilters: [{ 'valueObject.value': id }] }
      )
    )
  );
