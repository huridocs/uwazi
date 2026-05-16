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
  formatNestedProperty,
  formatDenormalizedNewRelationship,
} from '#V2/formatters/index.js';
import { resolvePropertyType } from '#V2/formatters/metadata/resolvePropertyMetadataValues.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { Entity } from '#V2/api/entities/types.js';

type useFormatMetadataOptions = { groupGeolocationProperties?: boolean };

type ResolvedType = BaseMetadataProperty['type'];

type FormatCtx = {
  field: BaseMetadataProperty;
  metadata: Entity['metadata'];
  entity: Entity;
  templates: ClientTemplateSchema[];
  entityTemplate: ClientTemplateSchema | undefined;
};

type Handler = (ctx: FormatCtx) => MetadataProperty | null;

const withMetadata =
  (
    format: (field: BaseMetadataProperty, metadata: Entity['metadata']) => MetadataProperty | null
  ): Handler =>
  ctx =>
    format(ctx.field, ctx.metadata);

const DISPATCH = new Map<ResolvedType, Handler>();

const register = (types: readonly ResolvedType[], handler: Handler) => {
  for (const t of types) {
    DISPATCH.set(t, handler);
  }
};

register(['text', 'generatedid', 'numeric', 'markdown'], withMetadata(formatSimpleProperty));
register(['date', 'daterange', 'multidate', 'multidaterange'], withMetadata(formatDateProperty));
register(['geolocation'], ctx => formatGeolocationProperty(ctx.field, ctx.entity, ctx.templates));
register(['select', 'multiselect'], withMetadata(formatSelectProperty));
register(['link'], withMetadata(formatLinkProperty));
register(['media'], withMetadata(formatMediaProperty));
register(['image', 'preview'], ctx =>
  formatImageProperty(ctx.field, ctx.metadata, ctx.entityTemplate)
);
register(['relationship'], withMetadata(formatRelationshipProperty));
register(['newRelationship'], ctx => {
  const denorm = formatDenormalizedNewRelationship(ctx);
  return denorm ?? formatRelationshipProperty(ctx.field, ctx.metadata);
});
register(['nested'], ctx => formatNestedProperty(ctx.field, ctx.metadata, ctx.entity.language));

function mapFieldToMetadataProperty(
  field: BaseMetadataProperty,
  entity: Entity,
  templates: ClientTemplateSchema[],
  entityTemplate: ClientTemplateSchema | undefined
): MetadataProperty | null {
  const { metadata } = entity;
  const type = resolvePropertyType(field, metadata);
  const handler = DISPATCH.get(type);
  return handler ? handler({ field, metadata, entity, templates, entityTemplate }) : null;
}

const useFormatMetadata = (
  entity: Entity,
  templates: ClientTemplateSchema[],
  options?: useFormatMetadataOptions
) => {
  const groupGeolocationProperties = options?.groupGeolocationProperties;

  const entityTemplate = useMemo(
    () => templates.find(template => template._id === entity.template),
    [entity.template, templates]
  );

  const metadataFields: BaseMetadataProperty[] = useMemo(
    () =>
      formatMetadataFields(entityTemplate, {
        groupGeolocationProperties,
      }),
    [entityTemplate, groupGeolocationProperties]
  );

  const metadata: MetadataProperty[] = useMemo(
    () =>
      metadataFields
        .map(field => mapFieldToMetadataProperty(field, entity, templates, entityTemplate))
        .filter(m => m) as MetadataProperty[],
    [entity, metadataFields, entityTemplate, templates]
  );

  return { entityTemplate, metadata };
};

export { useFormatMetadata };
