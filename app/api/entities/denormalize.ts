/* eslint-disable max-lines */
import { WithId } from 'api/odm';
import translationsModel from 'api/i18n/translations';
import { search } from 'api/search';
import templates from 'api/templates';
import dictionariesModel from 'api/thesauri/dictionariesModel';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import translate, { getContext } from 'shared/translate';
import { MetadataSchema, MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { isString } from 'util';

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
                  [`${update.valuePath}.$[valueIndex].inheritedValue`]:
                    newEntity.metadata?.[inheritProperty.name],
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
  language: string,
  parent: { id: string; label: string }
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
            ...(parent
              ? {
                  [`${entry.valuePath}.$[valueIndex].parent.label`]: parent.label,
                }
              : {}),
          },
        },
        { arrayFilters: [{ 'valueIndex.value': valueId }] }
      )
    )
  );

  await reindexUpdates(valueId, language, updates);
};

const denormalizeSelectProperty = async (
  property: PropertySchema,
  value: MetadataObjectSchema[],
  thesauriByKey: Record<string, ThesaurusSchema>,
  translation: any
) => {
  const thesaurus = thesauriByKey
    ? thesauriByKey[property.content!]
    : await dictionariesModel.getById(property.content);
  if (!thesaurus) {
    return undefined;
  }

  const context = getContext(translation, property.content);

  const flattenValues: (ThesaurusValueSchema & { parent?: ThesaurusValueSchema })[] = [];
  thesaurus.values?.forEach(dv => {
    if (dv.values) {
      dv.values.map(v => ({ ...v, parent: dv })).forEach(v => flattenValues.push(v));
    } else {
      flattenValues.push(dv);
    }
  });

  return value.map(_elem => {
    const elem = { ..._elem };
    const thesaurusValue = flattenValues.find(v => v.id === elem.value);

    if (thesaurusValue && thesaurusValue.label) {
      elem.label = translate(context, thesaurusValue.label, thesaurusValue.label);
    }

    if (thesaurusValue && thesaurusValue.parent) {
      elem.parent = {
        value: thesaurusValue.parent.id,
        label: translate(context, thesaurusValue.parent.label, thesaurusValue.parent.label),
      };
    }
    return elem;
  });
};

const denormalizeInheritedProperty = (
  property: PropertySchema,
  value: MetadataObjectSchema,
  partner: EntitySchema,
  allTemplates: TemplateSchema[]
) => {
  const partnerTemplate = allTemplates.find(
    t => t._id!.toString() === partner.template!.toString()
  );

  const inheritedProperty = partnerTemplate!.properties!.find(
    p => p._id && p._id.toString() === property!.inherit!.property!.toString()
  );

  return {
    ...value,
    inheritedValue: partner!.metadata?.[inheritedProperty!.name] || [],
    inheritedType: inheritedProperty!.type,
  };
};

const denormalizeRelationshipProperty = async (
  property: PropertySchema,
  value: MetadataObjectSchema[],
  language: string,
  allTemplates: TemplateSchema[]
) => {
  const partners = await model.getUnrestricted({
    sharedId: { $in: value.map(v => v.value as string) },
    language,
  });

  const partnersBySharedId: Record<string, EntitySchema> = {};
  partners.forEach(partner => {
    partnersBySharedId[partner.sharedId!] = partner;
  });

  return value.map(_elem => {
    let elem = { ..._elem };

    const partner = partnersBySharedId[elem.value as string];

    if (partner && partner.title) {
      elem.label = partner.title;
      elem.icon = partner.icon;
      elem.type = partner.file ? 'document' : 'entity';
    }

    if (property.inherit && property.inherit.property && partner) {
      elem = denormalizeInheritedProperty(property, elem, partner, allTemplates);
    }

    return elem;
  });
};

const denormalizeProperty = async (
  property: PropertySchema | undefined,
  value: MetadataObjectSchema[] | undefined,
  thesauriByKey: Record<string, ThesaurusSchema>,
  translation: any,
  allTemplates: TemplateSchema[],
  language: string
) => {
  if (!Array.isArray(value)) {
    throw new Error('denormalizeMetadata received non-array prop!');
  }
  value.forEach(elem => {
    if (!elem.hasOwnProperty('value')) {
      throw new Error('denormalizeMetadata received non-value prop!');
    }
  });

  if (!property) {
    return value;
  }

  if (property.content && ['select', 'multiselect'].includes(property.type)) {
    return denormalizeSelectProperty(property, value, thesauriByKey, translation);
  }

  if (property.type === 'relationship') {
    return denormalizeRelationshipProperty(property, value, language, allTemplates);
  }

  return value;
};

async function denormalizeMetadata(
  metadata: MetadataSchema,
  language: string,
  templateId: string,
  thesauriByKey: Record<string, ThesaurusSchema>
) {
  if (!metadata) {
    return metadata;
  }

  const translation = (await translationsModel.get({ locale: language }))[0];
  const allTemplates = await templates.get();

  const template = allTemplates.find(t => t._id.toString() === templateId);
  if (!template) {
    return metadata;
  }

  return Object.keys(metadata).reduce(
    async (meta, prop) => ({
      ...(await meta),
      [prop]: await denormalizeProperty(
        template.properties?.find(p => p.name === prop),
        metadata[prop],
        thesauriByKey,
        translation,
        allTemplates,
        language
      ),
    }),
    Promise.resolve({})
  );
}

export { denormalizeMetadata, denormalizeRelated, denormalizeThesauriLabelInMetadata };
