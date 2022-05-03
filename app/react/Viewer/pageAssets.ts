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
  let formattedItem = { ...item };

  formattedItem.displatValue = formattedItem.inheritedValue
    ? formattedItem.inheritedValue[0].value
    : formattedItem.label;
  formattedItem.type = formattedItem.inheritedType || formattedItem.type;
  // if (isObject(item)) {
  //   if (isArray(item.value)) {
  //     itemValue.value = item.value.map(target => {
  //       const relatedEntity = pickEntityFields(target.relatedEntity);
  //       const subValue = pick(target, ['value', 'url', 'icon']);
  //       return { ...subValue, ...relatedEntity };
  //     });
  //   }
  // }
  return pick(formattedItem, ['displatValue', 'type']);
};

const formatEntityData = (entity: EntitySchema, rawMetadata: MetadataSchema | undefined) => {
  const entityProperties = pickEntityFields(entity);
  const formattedMetadata = rawMetadata
    ? Object.entries(rawMetadata).map(([key, value]) => ({
        [key]: value ? value.map(mapPropertyValue) : [],
      }))
    : {};
  return {
    ...entityProperties,
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
    entityData: formatEntityData(formattedEntity, entityRaw.metadata),
    template: template.toJS(),
  };
};

export { prepareAssets };
