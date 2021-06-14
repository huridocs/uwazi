import { EntitySchema } from 'shared/types/entityType';
import { PropertySchema } from 'shared/types/commonTypes';
import templates from 'api/templates/templates';
import { search } from 'api/search';
import { TemplateSchema } from 'shared/types/templateType';
import { WithId } from 'api/odm';

import model from './entitiesModel';

interface Changes {
  label: string;
  icon?: EntitySchema['icon'];
}

interface Params {
  id: string;
  language?: string;
  template?: string;
}

export const updateDenormalization = async (
  { id, language, template }: Params,
  changes: Changes,
  properties: PropertySchema[]
) =>
  Promise.all(
    properties.map(async property =>
      model.updateMany(
        {
          ...(template ? { template } : {}),
          ...(language ? { language } : {}),
          [`metadata.${property.name}.value`]: id,
        },
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
            ? { [`metadata.${property.name}.$[].inheritedValue.$[valueObject].icon`]: changes.icon }
            : {}),
          [`metadata.${property.name}.$[].inheritedValue.$[valueObject].label`]: changes.label,
        },
        { arrayFilters: [{ 'valueObject.value': id }] }
      )
    )
  );

export const denormalizeRelated = async (
  entity: WithId<EntitySchema>,
  template: WithId<TemplateSchema>
) => {
  if (!entity.title || !entity.language || !entity.sharedId) {
    throw new Error('denormalization requires an entity with title, sharedId and language');
  }

  const transitiveProperties = await templates.propsThatNeedTransitiveDenormalization(
    template._id.toString()
  );
  const properties = await templates.propsThatNeedDenormalization(template._id.toString());

  await updateTransitiveDenormalization(
    { id: entity.sharedId, language: entity.language },
    { label: entity.title, icon: entity.icon },
    transitiveProperties
  );

  await Promise.all(
    properties.map(async prop => {
      const inheritProperty = (template.properties || []).find(
        p => prop.inheritProperty === p._id?.toString()
      );
      return updateDenormalization(
        {
          // @ts-ignore we have a sharedId guard, why ts does not like this ? bug ?
          id: entity.sharedId,
          language: entity.language,
          template: prop.template,
        },
        {
          ...(inheritProperty ? { inheritedValue: entity.metadata?.[inheritProperty.name] } : {}),
          label: entity.title,
          icon: entity.icon,
        },
        [prop]
      );
    })
  );

  if (properties.length || transitiveProperties.length) {
    await search.indexEntities({
      $and: [
        { language: entity.language },
        {
          $or: [
            ...properties.map(property => ({
              [`metadata.${property.name}.value`]: entity.sharedId,
            })),
            ...transitiveProperties.map(property => ({
              [`metadata.${property.name}.inheritedValue.value`]: entity.sharedId,
            })),
          ],
        },
      ],
    });
  }
  ////Crappy draft code ends
};
