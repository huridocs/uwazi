import { EntitySchema } from 'shared/types/entityType';
import { DenormalizationUpdate } from 'api/templates/templates';
import { search } from 'api/search';
import { TemplateSchema } from 'shared/types/templateType';
import { WithId } from 'api/odm';

import { PropertySchema } from 'shared/types/commonTypes';
import templatesModel from 'api/templates/templatesModel';
import model from './entitiesModel';

export function getMetadataChanges(
  previous: EntitySchema,
  current: EntitySchema,
  template: TemplateSchema
) {
  const diff = Object.keys(previous.metadata || {}).reduce<EntitySchema>(
    (_theDiff, key) => {
      const theDiff = { ..._theDiff };
      const thisChanged =
        (previous?.metadata || {})[key]?.every(
          (elem, i) =>
            JSON.stringify(elem.value) !== JSON.stringify(current?.metadata?.[key]?.[i]?.value)
        ) || (current?.metadata || {})?.[key]?.length !== previous.metadata?.[key]?.length;

      if (thisChanged) {
        theDiff.metadata = theDiff.metadata || {};
        theDiff.metadata[key] = previous.metadata?.[key];
      }
      return theDiff;
    },
    {
      ...(current.title !== previous.title ? { title: previous.title } : {}),
      ...(current.icon?._id !== previous.icon?._id ? { icon: previous.icon } : {}),
    }
  );

  const diffPropNames = Object.keys(diff.metadata || {});
  const metadataPropsThatChanged = template.properties
    ?.filter(p => diffPropNames.includes(p.name))
    .map(p => p._id?.toString());

  const titleIconChanged = !!(diff.title || diff.icon);

  return { metadataPropsThatChanged, titleIconChanged };
}

const uniqueBy = (updates: DenormalizationUpdate[]) => {
  const tmp = updates.reduce<{ [key: string]: DenormalizationUpdate }>(
    (memo, update) => ({ ...memo, [update.propertyName + update.inheritProperty]: update }),
    {}
  );

  return Object.values(tmp);
};

const calculateUpdates = (
  templates: TemplateSchema[],
  contentIds: string[],
  transitive: boolean = false
) =>
  uniqueBy(
    templates.reduce<DenormalizationUpdate[]>(
      (m, t) =>
        m.concat(
          t.properties
            ?.filter(p =>
              contentIds.includes(
                transitive ? p.inheritProperty || '' : p.content?.toString() || ''
              )
            )
            .map<DenormalizationUpdate>(p => ({
              propertyName: p.name,
              inheritProperty: p.inheritProperty,
              ...(p.inheritProperty ? { template: t._id?.toString() } : {}),
              transitive,
            })) || []
        ),
      []
    )
  );

interface DenomalizationOptions {
  metadataPropsThatChanged?: string[];
  titleIconChanged?: boolean;
}

export async function denormalizationUpdates(
  contentId: string,
  { metadataPropsThatChanged, titleIconChanged }: DenomalizationOptions = {
    metadataPropsThatChanged: [],
    titleIconChanged: false,
  }
) {
  if (metadataPropsThatChanged?.length === 0 && !titleIconChanged) {
    return [];
  }

  let properties: PropertySchema[] = (await templatesModel.get({ 'properties.content': contentId }))
    .reduce<PropertySchema[]>((m, t) => m.concat(t.properties || []), [])
    .filter(p => contentId === p.content?.toString());

  if (!titleIconChanged) {
    // @ts-ignore refactor so ['none'] is not needed?
    properties = ['none'];
  }

  return calculateUpdates(
    await templatesModel.get({
      $and: [
        { $or: [{ 'properties.content': contentId }, { 'properties.content': '' }] },
        ...(metadataPropsThatChanged?.length && !titleIconChanged
          ? [{ 'properties.inheritProperty': { $in: metadataPropsThatChanged } }]
          : []),
      ],
    }),
    [contentId, '']
  ).concat(
    calculateUpdates(
      await templatesModel.get({
        'properties.inheritProperty': {
          $in: properties.map(p => p._id?.toString()).filter(v => v),
        },
      }),
      properties
        .map<string | undefined>(p => p._id?.toString())
        .filter<string>(<(v: string | undefined) => v is string>(v => !!v)),
      true
    )
  );
}

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
  options: DenomalizationOptions
) => {
  if (!entity.title || !entity.language || !entity.sharedId) {
    throw new Error('denormalization requires an entity with title, sharedId and language');
  }

  // console.log(metadataPropsThatChanged);
  // console.log(titleIconChanged);
  const updates = await denormalizationUpdates(template._id.toString(), options);

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
          //propertyName: update.propertyName, WAS THIS NEEDED?
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
