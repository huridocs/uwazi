import { EntitySchema } from 'shared/types/entityType';
import templates, { DenormalizationUpdate } from 'api/templates/templates';
import { search } from 'api/search';
import { TemplateSchema } from 'shared/types/templateType';
import { WithId } from 'api/odm';

import model from './entitiesModel';

interface Changes {
  label: string;
  icon?: EntitySchema['icon'];
}

interface UpdateFilter {
  value: string;
  propertyName: string;
  language: string;
  template?: string;
  transitive?: boolean;
}

export const updateDenormalization = async (updateFilter: UpdateFilter, changes: Changes) =>
  model.updateMany(
    {
      ...(updateFilter.template ? { template: updateFilter.template } : {}),
      language: updateFilter.language,
      [updateFilter.transitive
        ? `metadata.${updateFilter.propertyName}.inheritedValue.value`
        : `metadata.${updateFilter.propertyName}.value`]: updateFilter.value,
    },
    {
      $set: Object.keys(changes).reduce(
        (set, propThatChanges) => ({
          ...set,
          [updateFilter.transitive
            ? `metadata.${updateFilter.propertyName}.$[].inheritedValue.$[valueObject].${propThatChanges}`
            : `metadata.${updateFilter.propertyName}.$[valueObject].${propThatChanges}`]: changes[
            <keyof Changes>propThatChanges
          ],
        }),
        {}
      ),
    },
    { arrayFilters: [{ 'valueObject.value': updateFilter.value }] }
  );

export const reindexByMetadataValue = async (
  value: string,
  language: string,
  updates: DenormalizationUpdate[]
) => {
  if (updates.length) {
    await search.indexEntities({
      $and: [
        { language },
        {
          $or: updates.map(update => ({
            [update.transitive
              ? `metadata.${update.propertyName}.inheritedValue.value`
              : `metadata.${update.propertyName}.value`]: value,
          })),
        },
      ],
    });
  }
};

export const denormalizeRelated = async (
  entity: WithId<EntitySchema>,
  template: WithId<TemplateSchema>,
  metadataPropsThatChanged: string[],
  titleIconChanged: boolean,
) => {
  if (!entity.title || !entity.language || !entity.sharedId) {
    throw new Error('denormalization requires an entity with title, sharedId and language');
  }

  // console.log(metadataPropsThatChanged);
  // console.log(titleIconChanged);
  const updates = await templates.denormalizationUpdates(template._id.toString(), metadataPropsThatChanged, titleIconChanged);

  // console.log(updates);

  await Promise.all(
    updates.map(async update => {
      const inheritProperty = (template.properties || []).find(
        p => update.inheritProperty === p._id?.toString()
      );

      return updateDenormalization(
        {
          // @ts-ignore we have a sharedId guard, why ts does not like this ? bug ?
          value: entity.sharedId,
          // @ts-ignore we have a sharedId guard, why ts does not like this ? bug ?
          language: entity.language,
          propertyName: update.propertyName,
          ...update,
        },
        {
          ...(inheritProperty ? { inheritedValue: entity.metadata?.[inheritProperty.name] } : {}),
          label: entity.title,
          icon: entity.icon,
        }
      );
    })
  );

  await reindexByMetadataValue(entity.sharedId, entity.language, updates);
};
