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

const composeEntityData = (rawEntity: EntitySchema) => {
  // const entity = pickEntityFields(rawEntity);
  // const newMetadata = entity.metadata.map((property: MetadataObjectSchema) => {
  //   const propertyName = property.name as string;
  //   if (isArray(property)) {
  //     return { [propertyName]: property.map(item => mapPropertyValue(item)) };
  //   }
  //   return { [propertyName]: mapPropertyValue(property) };
  // });
  // const composedMetadata =
  //   metadata && metadata.length > 0
  //     ? metadata.map(data => {
  //         console.log(data);
  //       })
  //     : {};
  // return {
  //   ...entity,
  //   metadata: composedMetadata,
  // };
};

const formatEntity = (
  entity: EntitySchema,
  template: IImmutable<TemplateSchema>,
  thesauris: ThesaurusSchema[]
) => {
  const formattedEntity = formatter.prepareMetadata(entity, [template], thesauris);
  formattedEntity.metadata = formattedEntity.metadata.reduce(
    (memo, property) => ({ ...memo, [property.name]: property }),
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
    entityData: {},
    template: template.toJS(),
  };
};

export { prepareAssets };
