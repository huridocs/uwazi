import { Entity } from '#V2/api/entities/types.js';
import { formatGeolocationProperty, formatRelationshipLinks } from '#V2/formatters/index.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import { isRelationshipProperty, templatePropertyInherits } from './metadataPropertyLayout.js';

type PropertyGroupMember = NonNullable<MetadataProperty['propertyGroup']>[number];

type MetadataRecordFields = {
  relationshipFields: RelationshipMetadataProperty[];
  otherFields: MetadataProperty[];
  inheritingTerminalById: Map<string, MetadataProperty>;
};

type FieldBuckets = {
  relationships: RelationshipMetadataProperty[];
  others: MetadataProperty[];
  terminals: Map<string, MetadataProperty>;
};

type BuildCtx = {
  inheritingIds: Set<string>;
  entity: Entity;
  templates: ClientTemplateSchema[];
  buckets: FieldBuckets;
};

const terminalGeoForMember = (
  member: PropertyGroupMember & { _id: string },
  entity: Entity,
  templates: ClientTemplateSchema[]
) =>
  formatGeolocationProperty(
    {
      _id: member._id,
      name: member.name,
      label: member.label,
      type: 'relationship',
      inherited: true,
      inheritedType: 'geolocation',
      relationShipTarget: member.content || '',
    },
    entity,
    templates
  );

const ownGeoFromMembers = (
  field: MetadataProperty,
  members: PropertyGroupMember[],
  entity: Entity,
  templates: ClientTemplateSchema[]
) => {
  if (members.length === 0) {
    return null;
  }
  if (members.length === 1) {
    const [member] = members;
    return formatGeolocationProperty(
      {
        _id: typeof member._id === 'string' ? member._id : field._id,
        name: member.name,
        label: member.label,
        type: 'geolocation',
      },
      entity,
      templates
    );
  }
  return formatGeolocationProperty(
    {
      _id: field._id,
      name: field.name,
      label: field.label,
      type: 'geolocation',
      propertyGroup: members,
    },
    entity,
    templates
  );
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

const pushInheritingLinkFields = (
  inheritingIds: Set<string>,
  templatePropertyById: Map<string, ClientProperty>,
  entity: Entity,
  relationships: RelationshipMetadataProperty[]
) => {
  inheritingIds.forEach(id => {
    const tpl = templatePropertyById.get(id);
    if (!tpl || typeof tpl._id !== 'string') {
      return;
    }
    const formatted = formatRelationshipLinks(
      {
        _id: tpl._id,
        name: tpl.name,
        label: tpl.label,
        type: 'relationship',
        inherited: true,
        inheritedType: tpl.inherit?.type,
        relationShipTarget: tpl.content || '',
      },
      entity.metadata
    );
    if (formatted) {
      relationships.push(formatted);
    }
  });
};

const inheritingGroupMembers = (
  group: PropertyGroupMember[],
  inheritingIds: Set<string>
): Array<PropertyGroupMember & { _id: string }> =>
  group.filter(
    (member): member is PropertyGroupMember & { _id: string } =>
      typeof member._id === 'string' && inheritingIds.has(member._id)
  );

const applyInheritingGeoTerminals = (
  members: Array<PropertyGroupMember & { _id: string }>,
  ctx: BuildCtx
) => {
  members.forEach(member => {
    const terminal = terminalGeoForMember(member, ctx.entity, ctx.templates);
    if (terminal) {
      ctx.buckets.terminals.set(member._id, terminal);
    }
  });
};

const pushOwnGeoFromMembers = (
  field: MetadataProperty,
  members: PropertyGroupMember[],
  ctx: BuildCtx
) => {
  const ownField = ownGeoFromMembers(field, members, ctx.entity, ctx.templates);
  if (ownField?.values.length) {
    ctx.buckets.others.push(ownField);
  }
};

const splitGroupedGeolocation = (field: MetadataProperty, ctx: BuildCtx): boolean => {
  if (field.type !== 'geolocation' || !field.propertyGroup?.length) {
    return false;
  }
  const inheritingMembers = inheritingGroupMembers(field.propertyGroup, ctx.inheritingIds);
  if (inheritingMembers.length === 0) {
    return false;
  }
  const ownMembers = field.propertyGroup.filter(
    member => typeof member._id !== 'string' || !ctx.inheritingIds.has(member._id)
  );
  applyInheritingGeoTerminals(inheritingMembers, ctx);
  pushOwnGeoFromMembers(field, ownMembers, ctx);
  return true;
};

const consumeMetadataField = (field: MetadataProperty, ctx: BuildCtx) => {
  if (ctx.inheritingIds.has(field._id)) {
    if (!isRelationshipProperty(field)) {
      ctx.buckets.terminals.set(field._id, field);
    }
    return;
  }
  if (splitGroupedGeolocation(field, ctx)) {
    return;
  }
  if (isRelationshipProperty(field)) {
    ctx.buckets.relationships.push(field);
    return;
  }
  ctx.buckets.others.push(field);
};

const buildMetadataRecordFields = (
  metadata: MetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>,
  entity: Entity,
  templates: ClientTemplateSchema[]
): MetadataRecordFields => {
  const buckets: FieldBuckets = {
    relationships: [],
    others: [],
    terminals: new Map(),
  };
  const inheritingIds = collectInheritingIds(templatePropertyById);
  pushInheritingLinkFields(inheritingIds, templatePropertyById, entity, buckets.relationships);
  const ctx: BuildCtx = { inheritingIds, entity, templates, buckets };
  metadata.forEach(field => consumeMetadataField(field, ctx));
  return {
    relationshipFields: buckets.relationships,
    otherFields: buckets.others,
    inheritingTerminalById: buckets.terminals,
  };
};

export { buildMetadataRecordFields };
export type { MetadataRecordFields };
