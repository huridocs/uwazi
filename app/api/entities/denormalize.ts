import { EntitySchema } from 'shared/types/entityType';
import { PropertySchema } from 'shared/types/commonTypes';
import model from './entitiesModel';
import templates from 'api/templates';
import { search } from 'api/search';
import { propertyTypes } from 'shared/propertyTypes';

const FIELD_TYPES_TO_SYNC = [
  propertyTypes.select,
  propertyTypes.multiselect,
  propertyTypes.date,
  propertyTypes.multidate,
  propertyTypes.multidaterange,
  propertyTypes.nested,
  propertyTypes.relationship,
  propertyTypes.relationship,
  propertyTypes.geolocation,
  propertyTypes.numeric,
];

export const denormalizeRelated = async (entity, template) => {
  //Crappy draft code starts

  // entidad(title entidadC) <- entidadB <- entidadC;
  // entidad(title thesauri) <- entidadB <- thesauri;

  // entidadB(title && inherited prop) <- entidadA;
  // entidadC(title && inherited prop) <- entidadA;

  // entidad(thesauriValue) <- thesauri;

  const fullEntity = entity;

  const properties = (
    await templates.get({
      $or: [{ 'properties.content': template._id.toString() }, { 'properties.content': '' }],
    })
  )
    .reduce((m, t) => m.concat(t.properties), [])
    .filter(p => template._id?.toString() === p.content?.toString() || p.content === '');

  const transitiveProperties = await templates.esteNombreEsUnAskoCambiar(template._id.toString());

  await updateTransitiveDenormalization(
    { id: fullEntity.sharedId, language: fullEntity.language },
    { label: fullEntity.title, icon: fullEntity.icon },
    transitiveProperties
  );

  await properties.reduce(async (prev, prop) => {
    await prev;
    const inheritProperty = template.properties.find(
      p => prop.inherit?.property === p._id.toString()
    );
    return updateDenormalization(
      {
        id: fullEntity.sharedId,
        ...(!FIELD_TYPES_TO_SYNC.includes(prop.type) ? { language: fullEntity.language } : {}),
      },
      {
        ...(inheritProperty ? { inheritedValue: fullEntity.metadata[inheritProperty.name] } : {}),
        label: fullEntity.title,
        icon: fullEntity.icon,
      },
      [prop]
    );
  }, Promise.resolve());

  if (properties.length || transitiveProperties.length) {
    await search.indexEntities({
      $or: [
        ...properties.map(property => ({
          $and: [
            {
              ...(!FIELD_TYPES_TO_SYNC.includes(property.type)
                ? { language: fullEntity.language }
                : {}),
            },
            {
              [`metadata.${property.name}.value`]: fullEntity.sharedId,
            },
          ],
        })),
        ...transitiveProperties.map(property => ({
          $and: [
            { language: fullEntity.language },
            { [`metadata.${property.name}.inheritedValue.value`]: fullEntity.sharedId },
          ],
        })),
      ],
    });
  }
  ////Crappy draft code ends
};

interface Changes {
  label: string;
  icon?: EntitySchema['icon'];
}

interface Params {
  id: string;
  language?: string;
}

export const updateTransitiveDenormalization = async (
  { id, language }: Params,
  changes: Changes,
  properties: PropertySchema[]
) =>
  Promise.all(
    properties.map(async property =>
      model.updateMany(
        { language, [`metadata.${property.name}.inheritedValue.value`]: id },
        {
          ...(changes.icon
            ? { [`metadata.${property.name}.$[].inheritedValue.$[valueObject].icon`]: changes.icon }
            : {}),
          [`metadata.${property.name}.$[].inheritedValue.$[valueObject].label`]: changes.label,
        },
        { arrayFilters: [{ 'valueObject.value': id }] }
      )
    )
  );

export const updateDenormalization = async (
  { id, language }: Params,
  changes: Changes,
  properties: PropertySchema[]
) =>
  Promise.all(
    properties.map(async property =>
      model.updateMany(
        { ...(language ? { language } : {}), [`metadata.${property.name}.value`]: id },
        {
          $set: Object.keys(changes).reduce(
            (set, prop) => ({
              ...set,
              [`metadata.${property.name}.$[valueObject].${prop}`]: changes[<keyof Changes>prop],
            }),
            {}
          ),
        },
        { arrayFilters: [{ 'valueObject.value': id }] }
      )
    )
  );
