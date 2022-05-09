import { formater as formatter } from 'app/Metadata';
import { pick, isArray, isObject, isEmpty, toPairs, take, get } from 'lodash';
import { MetadataObjectSchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

type FormattedEntity = EntitySchema & {
  metadata: MetadataObjectSchema[];
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
  const values: unknown[] = !isArray(item.value) ? [item] : item.value;

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

  return { ...entity, metadata: formattedMetadata };
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
  templates: IImmutable<TemplateSchema>[],
  thesauris: ThesaurusSchema[]
) => {
  const formattedEntity = formatter.prepareMetadata(entityRaw, templates, thesauris);
  const entity = formatEntity(formattedEntity);
  const entityData = formatEntityData(formattedEntity);
  return {
    entity,
    entityRaw,
    entityData,
    template: template.toJS(),
  };
};

export { prepareAssets };
