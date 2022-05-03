import { formater as formatter } from 'app/Metadata';
import { pick, isObject, isArray } from 'lodash';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const pickEntityFields = (entity: EntitySchema) =>
  pick(entity, [
    'title',
    'sharedId',
    'creationDate',
    'editDate',
    'language',
    'template',
    'metadata',
  ]);

const formatProperty = (item: any) => {
  let formattedItem = { ...item };

  if (!isObject(item)) {
    return item;
  }

  if (isObject(item)) {
    if (isArray(item.value)) {
      // itemValue.value = item.value.map(target => {
      //   const relatedEntity = pickEntityFields(target.relatedEntity);
      //   const subValue = pick(target, ['value', 'url', 'icon']);
      //   return { ...subValue, ...relatedEntity };
      // });
      formattedItem = item.value.map(target => ({
        displayValue: target.value,
        value: target.originalValue || target.value,
        ...(target.relatedEntity && { reference: target.relatedEntity }),
      }));
    }
  }
  return formattedItem;
};

const formatEntityData = (formattedEntity: EntitySchema) => {
  const entity = pickEntityFields(formattedEntity);
  const formattedMetadata = entity.metadata
    ? Object.entries(entity.metadata).map(([key, value]) => ({
        [key]: formatProperty(value),
      }))
    : {};

  return { ...entity, metadata: formattedMetadata };
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
  const entity = formatEntity(entityRaw, template, thesauris);
  const entityData = formatEntityData(entity);
  return {
    entity,
    entityRaw,
    entityData,
    template: template.toJS(),
  };
};

export { prepareAssets };
