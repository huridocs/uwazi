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
  let formattedItem = [
    {
      displayValue: item.value,
      value: item.timestamp || item.originalValue || item.value,
      type: item.type,
      name: item.name,
    },
  ];

  if (isArray(item.value)) {
    // itemValue.value = item.value.map(target => {
    //   const relatedEntity = pickEntityFields(target.relatedEntity);
    //   const subValue = pick(target, ['value', 'url', 'icon']);
    //   return { ...subValue, ...relatedEntity };
    // });
    formattedItem = item.value.map(target => {
      if (item.type === 'geolocation') {
        return {
          displayValue: target,
          value: target,
          name: item.name,
          type: item.type,
        };
      }
      return {
        displayValue: target.value,
        value: target.originalValue || target.value,
        ...(target.relatedEntity && { reference: target.relatedEntity }),
        name: item.name,
        type: item.type,
      };
    });
  }

  return formattedItem;
};

const formatEntityData = (formattedEntity: EntitySchema) => {
  const entity = pickEntityFields(formattedEntity);
  const formattedMetadata = entity.metadata.reduce((memo, property) => {
    const formattedProperty = formatProperty(property);
    return { ...memo, [property.name]: formattedProperty };
  }, {});

  return { ...entity, metadata: formattedMetadata };
};

const formatEntity = (formattedEntity: EntitySchema) => {
  const entity = { ...formattedEntity };
  entity.metadata = formattedEntity.metadata.reduce(
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
  const formattedEntity = formatter.prepareMetadata(entityRaw, [template], thesauris);
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
