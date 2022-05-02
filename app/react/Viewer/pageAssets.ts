import { formater as formatter } from 'app/Metadata';
import { pick, isObject, isArray } from 'lodash';
import { MetadataObjectSchema, MetadataSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const pickEntityFields = (entity: EntitySchema) =>
  pick(entity, ['title', 'sharedId', 'creationDate', 'editDate', 'language', 'template']);

const mapPropertyValue = (item: any) => {
  if (!isObject(item)) {
    return item;
  }

  let itemValue = item;
  if (isObject(item)) {
    itemValue = pick(item, ['name', 'label', 'content', '_id', 'type', 'timestamp', 'value']);
    if (isArray(item.value)) {
      itemValue.value = item.value.map(target => {
        const relatedEntity = pickEntityFields(target.relatedEntity);
        const subValue = pick(target, ['value', 'url', 'icon']);
        return { ...subValue, ...relatedEntity };
      });
    }
  }

  return itemValue;
};

const composeEntityData = (entityRaw: EntitySchema, metadata) => {
  const entity = pickEntityFields(entityRaw);
  const formattedMetadata = Object.entries(entityRaw.metadata || {}).map(([key, values]) => {
    const formattedValue = values?.map(value => {
      return {
        ...value,
        displayValue: value.label,
        value: value.value,
      };
    });
    return {
      [key]: formattedValue,
    };
  });
  console.log(JSON.stringify(formattedMetadata, null, 2));
  return {
    ...entity,
    metadata: formattedMetadata,
  };
};

const formatEntity = (
  entity: EntitySchema,
  template: IImmutable<TemplateSchema>,
  thesauris: ThesaurusSchema[]
) => {
  const formattedEntity = formatter.prepareMetadata(entity, [template], thesauris);
  formattedEntity.metadata = formattedEntity.metadata.reduce(
    (memo: MetadataObjectSchema, property: MetadataObjectSchema) => ({
      ...memo,
      [property.name as string]: property,
    }),
    {}
  );
  return formattedEntity;
};

const prepareAssets = (
  entityRaw: EntitySchema,
  template: IImmutable<TemplateSchema>,
  thesauris: ThesaurusSchema[]
) => {
  const formattedEntity = formatEntity(entityRaw, template, thesauris);
  return {
    entity: formattedEntity,
    entityRaw,
    entityData: composeEntityData(entityRaw, formattedEntity.metadata),
    template: template.toJS(),
  };
};

export { prepareAssets };
