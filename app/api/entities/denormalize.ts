import { EntitySchema } from 'shared/types/entityType';
import { search } from 'api/search';
import { TemplateSchema } from 'shared/types/templateType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { WithId } from 'api/odm';
import { isString } from 'util';

import templates from 'api/templates';
import model from './entitiesModel';

interface DenormalizationUpdate {
  propertyName: string;
  filterPath: string;
  valuePath: string;
  template?: string;
  inheritProperty?: string;
}

interface PropWithTemplate extends PropertySchema {
  template?: string;
}

const metadataChanged = (
  newMetadata: MetadataObjectSchema[] = [],
  oldMetadata: MetadataObjectSchema[] = []
) =>
  newMetadata.every(
    (elem, index) => JSON.stringify(elem.value) !== JSON.stringify(oldMetadata[index]?.value)
  ) || newMetadata.length !== oldMetadata.length;

const diffEntities = (newEntity: EntitySchema, oldEntity: EntitySchema) =>
  Object.keys(newEntity.metadata || {}).reduce<EntitySchema>(
    (theDiff, key) => {
      if (metadataChanged(newEntity?.metadata?.[key], oldEntity?.metadata?.[key])) {
        // eslint-disable-next-line no-param-reassign
        theDiff.metadata = theDiff.metadata || {};
        // eslint-disable-next-line no-param-reassign
        theDiff.metadata[key] = newEntity.metadata?.[key];
      }
      return theDiff;
    },
    {
      ...(newEntity.title !== oldEntity.title ? { title: oldEntity.title } : {}),
      ...(newEntity.icon?._id !== oldEntity.icon?._id ? { icon: oldEntity.icon } : {}),
    }
  );

function getPropertiesThatChanged(entityDiff: EntitySchema, template: TemplateSchema) {
  const diffPropNames = Object.keys(entityDiff.metadata || {});
  const metadataPropsThatChanged = (template.properties || [])
    .filter(p => diffPropNames.includes(p.name))
    .map(p => p._id?.toString())
    .filter(isString);

  if (entityDiff.title) {
    metadataPropsThatChanged.push('label');
  }
  if (entityDiff.icon) {
    metadataPropsThatChanged.push('icon');
  }
  return metadataPropsThatChanged;
}

const uniqueByNameAndInheritProperty = (updates: DenormalizationUpdate[]) =>
  Object.values(
    updates.reduce<{
      [key: string]: DenormalizationUpdate;
    }>((memo, update) => ({ ...memo, [update.propertyName + update.inheritProperty]: update }), {})
  );

const oneJumpRelatedProps = async (contentId: string) => {
  const anyEntityOrDocument = '';
  const contentIds = [contentId, anyEntityOrDocument];
  return (await templates.get({ 'properties.content': { $in: contentIds } })).reduce<
    PropWithTemplate[]
  >(
    (props, template) =>
      props.concat(
        (template.properties || [])
          .filter(p => contentIds.includes(p.content?.toString() || ''))
          .map(p => ({
            ...p,
            template: template._id.toString(),
          }))
      ),
    []
  );
};

const oneJumpUpdates = async (
  contentId: string,
  metadataPropsThatChanged: string[],
  titleOrIconChanged: boolean
) => {
  let updates = (await oneJumpRelatedProps(contentId)).map<DenormalizationUpdate>(p => ({
    propertyName: p.name,
    inheritProperty: p.inherit?.property,
    ...(p.inherit?.property ? { template: p.template } : {}),
    filterPath: `metadata.${p.name}.value`,
    valuePath: `metadata.${p.name}`,
  }));

  if (metadataPropsThatChanged?.length && !titleOrIconChanged) {
    updates = updates.filter(u => metadataPropsThatChanged.includes(u.inheritProperty || ''));
  }
  return updates;
};

const twoJumpsRelatedProps = async (contentId: string) => {
  const properties: PropertySchema[] = (await templates.get({ 'properties.content': contentId }))
    .reduce<PropertySchema[]>((m, t) => m.concat(t.properties || []), [])
    .filter(p => contentId === p.content?.toString());

  const contentIds = properties
    .map<string | undefined>(p => p._id?.toString())
    .filter<string>(<(v: string | undefined) => v is string>(v => !!v));

  return (await templates.get({ 'properties.inherit.property': { $in: contentIds } })).reduce<
    PropWithTemplate[]
  >(
    (props, template) =>
      props.concat(
        (template.properties || []).filter(p => contentIds.includes(p.inherit?.property || ''))
      ),
    []
  );
};

const twoJumpUpdates = async (contentId: string) =>
  (await twoJumpsRelatedProps(contentId)).map<DenormalizationUpdate>(p => ({
    propertyName: p.name,
    inheritProperty: p.inherit?.property,
    filterPath: `metadata.${p.name}.inheritedValue.value`,
    valuePath: `metadata.${p.name}.$[].inheritedValue`,
  }));

async function denormalizationUpdates(contentId: string, templatePropertiesThatChanged: string[]) {
  const titleOrIconChanged =
    templatePropertiesThatChanged.includes('label') ||
    templatePropertiesThatChanged.includes('icon');

  const metadataPropsThatChanged = templatePropertiesThatChanged.filter(
    v => !['icon', 'label'].includes(v)
  );

  return uniqueByNameAndInheritProperty([
    ...(await oneJumpUpdates(contentId, metadataPropsThatChanged, titleOrIconChanged)),
    ...(titleOrIconChanged ? await twoJumpUpdates(contentId) : []),
  ]);
}

const reindexUpdates = async (
  value: string,
  language: string,
  updates: DenormalizationUpdate[]
) => {
  if (updates.length) {
    await search.indexEntities({
      $and: [{ language }, { $or: updates.map(update => ({ [update.filterPath]: value })) }],
    });
  }
};

const denormalizeRelated = async (
  newEntity: WithId<EntitySchema>,
  template: WithId<TemplateSchema>,
  existingEntity: EntitySchema = {}
) => {
  if (!newEntity.title || !newEntity.language || !newEntity.sharedId) {
    throw new Error('denormalization requires an entity with title, sharedId and language');
  }

  const entityDiff = diffEntities(newEntity, existingEntity);
  const templatePropertiesThatChanged = getPropertiesThatChanged(entityDiff, template);
  if (templatePropertiesThatChanged.length === 0) {
    return false;
  }

  const updates = await denormalizationUpdates(
    template._id.toString(),
    templatePropertiesThatChanged
  );

  await Promise.all(
    updates.map(async update => {
      const inheritProperty = (template.properties || []).find(
        p => update.inheritProperty === p._id?.toString()
      );

      return model.updateMany(
        {
          [update.filterPath]: newEntity.sharedId,
          language: newEntity.language,
          ...(update.template ? { template: update.template } : {}),
        },
        {
          $set: {
            [`${update.valuePath}.$[valueIndex].label`]: newEntity.title,
            [`${update.valuePath}.$[valueIndex].icon`]: newEntity.icon,
            ...(inheritProperty
              ? {
                  [`${update.valuePath}.$[valueIndex].inheritedValue`]: newEntity.metadata?.[
                    inheritProperty.name
                  ],
                }
              : {}),
          },
        },
        { arrayFilters: [{ 'valueIndex.value': newEntity.sharedId }] }
      );
    })
  );

  return reindexUpdates(newEntity.sharedId, newEntity.language, updates);
};

const denormalizeThesauriLabelInMetadata = async (
  valueId: string,
  newLabel: string,
  thesaurusId: string,
  language: string
) => {
  const updates = await denormalizationUpdates(thesaurusId.toString(), ['label']);
  await Promise.all(
    updates.map(async entry =>
      model.updateMany(
        {
          [entry.filterPath]: valueId,
          language,
          ...(entry.template ? { template: entry.template } : {}),
        },
        {
          $set: {
            [`${entry.valuePath}.$[valueIndex].label`]: newLabel,
          },
        },
        { arrayFilters: [{ 'valueIndex.value': valueId }] }
      )
    )
  );
  await reindexUpdates(valueId, language, updates);
};

export { denormalizeRelated, denormalizeThesauriLabelInMetadata };
