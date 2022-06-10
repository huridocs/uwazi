import { IStore } from 'app/istore';
import { formater as formatter } from 'app/Metadata';
import { pick, isArray, isObject, isEmpty, toPairs, take, get, groupBy, has } from 'lodash';
import {
  MetadataObjectSchema,
  MetadataSchema,
  PropertyValueSchema,
} from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';

type Relation = { template: string; entityData: EntitySchema };

type FormattedEntity = EntitySchema & {
  metadata: MetadataObjectSchema[];
  relations: Relation[];
};

type FormattedPropertyValueSchema = Partial<MetadataObjectSchema> & {
  type?: string;
  relatedEntity?: FormattedEntity;
  value?: PropertyValueSchema;
};

const pickEntityFields = (entity: FormattedEntity) =>
  pick(entity, [
    'title',
    'sharedId',
    'creationDate',
    'editDate',
    'language',
    'template',
    'inheritedProperty',
  ]);

const metadataFields = (property: FormattedPropertyValueSchema) => {
  switch (property.type) {
    case 'geolocation':
      return {
        displayValue: 'value[0]',
        value: 'value',
      };
    default:
      return {
        displayValue: 'value',
        value: ['timestamp', 'originalValue', 'value'],
      };
  }
};

const propertyDisplayType = (property: FormattedPropertyValueSchema) => {
  switch (property.type) {
    case 'relationship':
      return 'inherit';
    default:
      return property.type;
  }
};

type MetadataFieldValues = {
  displayValue: string;
  value: string | string[];
};

const formatPropertyValue = (
  target: FormattedPropertyValueSchema,
  metadataField: MetadataFieldValues
) => {
  const availableProperties = pick(target, metadataField.value);
  const firstValue =
    isObject(availableProperties) && !isEmpty(availableProperties)
      ? take(toPairs(availableProperties), 1)[0][1]
      : target;
  return firstValue;
};

const formatProperty = (item: FormattedPropertyValueSchema) => {
  const values: unknown[] = !isArray(item.value) || !item.value.length ? [item] : item.value;

  const formattedItem = values.map((target: any) => {
    const relatedEntity = pickEntityFields(target.relatedEntity);
    const metadataField = metadataFields(item);
    const value = formatPropertyValue(target, metadataField);

    return {
      displayValue: get(target, metadataField.displayValue, value),
      value,
      name: item.name,
      type: propertyDisplayType(item),
      ...(!isEmpty(relatedEntity) ? { reference: relatedEntity } : {}),
    };
  });

  return formattedItem;
};

const reletationsAggregationsMetadata = (metadata: MetadataSchema) =>
  Object.entries(metadata).reduce((memo, [propertyName, values]) => {
    const formmatedValues = (values as FormattedPropertyValueSchema[]).map(value =>
      value.label && value.label.length ? value.label : value.value
    );
    const result = { [propertyName]: formmatedValues };
    return { ...memo, ...result };
  }, {});

const aggregateByTemplate = (relations: Relation[], relationship: { _id: string; name: string }) =>
  relations.reduce((groupedRelations, relation) => {
    const { template } = relation.entityData;
    const groupName = `${relationship.name}-${template}`;
    const metadata = reletationsAggregationsMetadata(relation.entityData.metadata || {});

    const relatedEntity = {
      title: relation.entityData.title,
      sharedId: relation.entityData.sharedId,
      metadata,
    };

    return !has(groupedRelations, groupName)
      ? { ...groupedRelations, [groupName]: [relatedEntity] }
      : { ...groupedRelations, [groupName]: [...groupedRelations[groupName], relatedEntity] };
  }, {} as { [key: string]: EntitySchema[] });

const aggregateRelationships = (
  entity: FormattedEntity,
  relationTypes: { _id: string; name: string }[]
) => {
  if (!entity.relations || entity.relations.length === 0) {
    return {};
  }

  const relationshipGroups = groupBy(entity.relations, 'template');

  const namedRelationshipGroups = Object.entries(relationshipGroups).reduce(
    (aggregated, [relationshipId, relations]) => {
      const relationship = relationTypes.find(({ _id }) => _id === relationshipId);

      if (relationship) {
        const result = aggregateByTemplate(relations, relationship);

        return { ...aggregated, ...result };
      }
      return aggregated;
    },
    {}
  );

  return namedRelationshipGroups;
};

const formatEntityData = (
  formattedEntity: FormattedEntity,
  relationTypes: { _id: string; name: string }[]
) => {
  const entity = pickEntityFields(formattedEntity);
  const formattedMetadata = formattedEntity.metadata.reduce((memo, property) => {
    const formattedProperty = formatProperty(property);
    return { ...memo, [property.name as string]: formattedProperty };
  }, {});

  const relationshipAggregations = aggregateRelationships(formattedEntity, relationTypes);

  return {
    ...entity,
    metadata: formattedMetadata,
    inherited_relationships: relationshipAggregations,
  };
};

const formatEntity = (formattedEntity: FormattedEntity) => {
  const originalMetadata: MetadataObjectSchema[] = formattedEntity.metadata;
  const metadata = originalMetadata.reduce(
    (memo, property) => ({
      ...memo,
      [property.name as string]: property,
    }),
    {}
  );
  return { ...formattedEntity, metadata };
};

const prepareAssets = (
  entityRaw: EntitySchema,
  template: IImmutable<TemplateSchema>,
  state: Pick<IStore, 'templates' | 'thesauris'>,
  relationTypes: { _id: string; name: string }[]
) => {
  const formattedEntity = formatter.prepareMetadata(entityRaw, state.templates, state.thesauris);
  const entity = formatEntity(formattedEntity);
  const entityData = formatEntityData(formattedEntity, relationTypes);
  return {
    entity,
    entityRaw,
    entityData,
    template: template.toJS(),
  };
};

export { prepareAssets };
