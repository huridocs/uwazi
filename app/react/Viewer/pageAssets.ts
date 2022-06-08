import { IStore } from 'app/istore';
import { formater as formatter } from 'app/Metadata';
import { pick, isArray, isObject, isEmpty, toPairs, take, get, groupBy } from 'lodash';
import { MetadataObjectSchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';

type FormattedEntity = EntitySchema & {
  metadata: MetadataObjectSchema[];
  relations: any[];
};

type FormattedPropertyValueSchema = Partial<MetadataObjectSchema> & {
  type?: string;
  relatedEntity?: FormattedEntity;
  value?: PropertyValueSchema;
};

const aggregateRelationships = (
  entity: FormattedEntity,
  relationTypes: { _id: string; name: string }[]
) => {
  if (!entity.relations || entity.relations.length === 0) {
    return [];
  }
  const relationshipGroups = groupBy(entity.relations, 'template');

  const namedRelationshipGroups = Object.entries(relationshipGroups).reduce(
    (memo, [relationshipId, relations]) => {
      const relationship = relationTypes.find(({ _id }) => _id === relationshipId);
      if (relationship) {
        const { template } = relations[0].entityData;
        const groupname = `${relationship.name}-${template}`;
        return { [groupname]: relations, ...memo };
      }
      return {};
    },
    {}
  );

  return namedRelationshipGroups;
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

const formatEntityData = (formattedEntity: FormattedEntity) => {
  const entity = pickEntityFields(formattedEntity);
  const formattedMetadata = formattedEntity.metadata.reduce((memo, property) => {
    const formattedProperty = formatProperty(property);
    return { ...memo, [property.name as string]: formattedProperty };
  }, {});

  return {
    ...entity,
    metadata: formattedMetadata,
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
  const entityData = {
    ...formatEntityData(formattedEntity),
    inherited_relationships: aggregateRelationships(formattedEntity, relationTypes),
  };
  return {
    entity,
    entityRaw,
    entityData,
    template: template.toJS(),
  };
};

export { prepareAssets };
