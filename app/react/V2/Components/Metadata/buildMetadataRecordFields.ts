import { Entity } from '#V2/api/entities/types.js';
import { formatRelationshipLinks } from '#V2/formatters/index.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';
import { isRelationshipProperty, templatePropertyInherits } from './metadataPropertyLayout.js';

type MetadataRecordFields = {
  relationshipFields: RelationshipMetadataProperty[];
  otherFields: MetadataProperty[];
};

const collectInheritingIds = (templatePropertyById: Map<string, ClientProperty>) => {
  const inheritingIds = new Set<string>();
  templatePropertyById.forEach((tpl, id) => {
    if (tpl.type === 'relationship' && templatePropertyInherits(tpl)) {
      inheritingIds.add(id);
    }
  });
  return inheritingIds;
};

const groupedGeolocationInheritIds = (metadata: MetadataProperty[]) => {
  const ids = new Set<string>();
  metadata.forEach(field => {
    const group = field.propertyGroup;
    if (field.type !== 'geolocation' || !group || group.length < 2) {
      return;
    }
    group.forEach(member => {
      if (member.inherited && member._id) {
        ids.add(member._id);
      }
    });
  });
  return ids;
};

const pushInheritingLinkFields = ({
  inheritingIds,
  groupedInheritGeoIds,
  templatePropertyById,
  entity,
  relationships,
}: {
  inheritingIds: Set<string>;
  groupedInheritGeoIds: Set<string>;
  templatePropertyById: Map<string, ClientProperty>;
  entity: Entity;
  relationships: RelationshipMetadataProperty[];
}) => {
  inheritingIds.forEach(id => {
    if (groupedInheritGeoIds.has(id)) {
      return;
    }
    const tpl = templatePropertyById.get(id);
    if (!tpl) {
      return;
    }
    const formatted = formatRelationshipLinks(
      {
        _id: id,
        name: tpl.name,
        label: tpl.label,
        type: 'relationship',
        inherited: true,
        inheritedType: tpl.inherit?.type,
        relationShipTarget: tpl.content || '',
      },
      entity.metadata,
      entity.relations
    );
    if (formatted) {
      relationships.push(formatted);
    }
  });
};

const consumeMetadataField = (
  field: MetadataProperty,
  ctx: {
    inheritingIds: Set<string>;
    relationships: RelationshipMetadataProperty[];
    others: MetadataProperty[];
  }
) => {
  if (ctx.inheritingIds.has(field._id)) {
    return;
  }
  if (isRelationshipProperty(field)) {
    ctx.relationships.push(field);
    return;
  }
  ctx.others.push(field);
};

const buildMetadataRecordFields = (
  metadata: MetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>,
  entity: Entity
): MetadataRecordFields => {
  const relationships: RelationshipMetadataProperty[] = [];
  const others: MetadataProperty[] = [];
  const inheritingIds = collectInheritingIds(templatePropertyById);
  const groupedInheritGeoIds = groupedGeolocationInheritIds(metadata);
  pushInheritingLinkFields({
    inheritingIds,
    groupedInheritGeoIds,
    templatePropertyById,
    entity,
    relationships,
  });
  metadata.forEach(field => consumeMetadataField(field, { inheritingIds, relationships, others }));
  return {
    relationshipFields: relationships,
    otherFields: others,
  };
};

export { buildMetadataRecordFields };
export type { MetadataRecordFields };
