import { useMemo } from 'react';
import { BaseMetadataProperty, MetadataProperty } from '#V2/formatters/types.js';
import {
  formatRelationshipProperty,
  formatSimpleProperty,
  formatDateProperty,
  formatGeolocationProperty,
  formatLinkProperty,
  formatMediaProperty,
  formatImageProperty,
  formatMetadataFields,
  formatSelectProperty,
} from '#V2/formatters/index.js';
import { resolvePropertyType } from '#V2/formatters/metadata/resolvePropertyMetadataValues.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { Entity } from '#V2/api/entities/types.js';

type useFormatMetadataOptions = { groupGeolocationProperties?: boolean };

const useFormatMetadata = (
  entity: Entity,
  templates: ClientTemplateSchema[],
  options?: useFormatMetadataOptions
) => {
  const entityTemplate = useMemo(
    () => templates.find(template => template._id === entity.template),
    [entity.template, templates]
  );

  const metadataFields: BaseMetadataProperty[] = useMemo(
    () =>
      formatMetadataFields(entityTemplate, {
        groupGeolocationProperties: options?.groupGeolocationProperties,
      }),
    [entityTemplate]
  );

  const metadata: MetadataProperty[] = useMemo(
    () =>
      metadataFields
        .map(field => {
          const type = resolvePropertyType(field, entity.metadata);

          if (
            type === 'text' ||
            type === 'generatedid' ||
            type === 'numeric' ||
            type === 'markdown'
          ) {
            return formatSimpleProperty(field, entity.metadata);
          }

          if (
            type === 'date' ||
            type === 'daterange' ||
            type === 'multidate' ||
            type === 'multidaterange'
          ) {
            return formatDateProperty(field, entity.metadata);
          }

          if (type === 'geolocation') {
            return formatGeolocationProperty(field, entity, templates);
          }

          if (type === 'select' || type === 'multiselect') {
            return formatSelectProperty(field, entity.metadata);
          }

          if (type === 'link') {
            return formatLinkProperty(field, entity.metadata);
          }

          if (type === 'media') {
            return formatMediaProperty(field, entity.metadata);
          }

          if (type === 'image' || type === 'preview') {
            return formatImageProperty(field, entity.metadata, entityTemplate);
          }

          if (type === 'relationship') {
            return formatRelationshipProperty(field, entity.metadata);
          }

          return null;
        })
        .filter(m => m) as MetadataProperty[],
    [entity, metadataFields, entityTemplate, templates]
  );

  return { entityTemplate, metadata };
};

export { useFormatMetadata };
