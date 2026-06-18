import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { directionOf } from './types.js';

type RelationshipsPanelGroupBy =
  | 'none'
  | 'target-template'
  | 'target-entity'
  | 'source-template'
  | 'source-entity'
  | 'relation-type'
  | 'direction'
  | 'source-page';

type GroupLabelContext = {
  selfSharedId: string;
  selfTitle: string;
  selfTemplateId: string;
  relationshipTypeName: (typeId: string) => string;
  templateName: (templateId: string) => string;
  templateColor: (templateId: string) => string | undefined;
};

const groupingOptions: { id: RelationshipsPanelGroupBy }[] = [
  { id: 'none' },
  { id: 'target-template' },
  { id: 'target-entity' },
  { id: 'source-template' },
  { id: 'source-entity' },
  { id: 'relation-type' },
  { id: 'direction' },
  { id: 'source-page' },
];

const getGroupKey = (
  marker: RelationshipMarker,
  by: RelationshipsPanelGroupBy,
  context: GroupLabelContext
): string => {
  switch (by) {
    case 'target-template':
      return marker.target.templateId || 'unknown';
    case 'target-entity':
      return marker.target.sharedId;
    case 'source-template':
      return context.selfTemplateId || 'unknown';
    case 'source-entity':
      return context.selfSharedId;
    case 'relation-type':
      return marker.view.type || 'no_label';
    case 'direction':
      return directionOf(marker.view, context.selfSharedId);
    case 'source-page': {
      const page = marker.anchor?.selections[0]?.page;
      return page === undefined ? 'no-page' : String(page);
    }
    case 'none':
    default:
      return '';
  }
};

const isUnknownGroupKey = (key: string, by: RelationshipsPanelGroupBy): boolean => {
  switch (by) {
    case 'target-template':
    case 'source-template':
      return key === 'unknown';
    case 'relation-type':
      return key === 'no_label';
    case 'source-page':
      return key === 'no-page';
    default:
      return false;
  }
};

type GroupLabelDescriptor =
  | { kind: 'translate'; key: string }
  | { kind: 'translatePage'; page: string }
  | { kind: 'text'; value: string };

const directionLabelKey = (key: string): string => {
  if (key === 'both') return 'Bidirectional';
  if (key === 'incoming') return 'Incoming';
  return 'Outgoing';
};

const describeGroupLabel = (
  key: string,
  by: RelationshipsPanelGroupBy,
  context: GroupLabelContext,
  markers: RelationshipMarker[]
): GroupLabelDescriptor => {
  switch (by) {
    case 'direction':
      return { kind: 'translate', key: directionLabelKey(key) };
    case 'source-page':
      if (key === 'no-page') return { kind: 'translate', key: 'No page' };
      return { kind: 'translatePage', page: key };
    case 'target-template':
    case 'source-template': {
      const name = context.templateName(key);
      if (!name || key === 'unknown') return { kind: 'translate', key: 'Unknown template' };
      return { kind: 'text', value: name };
    }
    case 'target-entity': {
      const title = markers.find(marker => marker.target.sharedId === key)?.target.title;
      if (!title) return { kind: 'translate', key: 'Unknown entity' };
      return { kind: 'text', value: title };
    }
    case 'source-entity':
      return { kind: 'text', value: context.selfTitle };
    case 'relation-type': {
      const name = context.relationshipTypeName(key);
      if (!name || key === 'no_label') return { kind: 'text', value: key };
      return { kind: 'text', value: name };
    }
    case 'none':
    default:
      return { kind: 'text', value: key };
  }
};

const getGroupLabel = (
  key: string,
  by: RelationshipsPanelGroupBy,
  context: GroupLabelContext,
  markers: RelationshipMarker[]
): string => {
  const descriptor = describeGroupLabel(key, by, context, markers);
  if (descriptor.kind === 'translate') return descriptor.key;
  if (descriptor.kind === 'translatePage') return `Page ${descriptor.page}`;
  return descriptor.value;
};

const getGroupColor = (
  key: string,
  by: RelationshipsPanelGroupBy,
  context: GroupLabelContext,
  markers: RelationshipMarker[]
): string | undefined => {
  switch (by) {
    case 'target-template':
      return context.templateColor(key);
    case 'source-template':
      return context.templateColor(context.selfTemplateId);
    case 'target-entity': {
      const templateId = markers.find(marker => marker.target.sharedId === key)?.target.templateId;
      return templateId ? context.templateColor(templateId) : undefined;
    }
    default:
      return undefined;
  }
};

const groupMarkers = (
  markers: RelationshipMarker[],
  by: RelationshipsPanelGroupBy,
  context: GroupLabelContext
): [string, RelationshipMarker[]][] => {
  if (by === 'none') return [['', markers]];

  const map = new Map<string, RelationshipMarker[]>();
  for (const marker of markers) {
    const key = getGroupKey(marker, by, context);
    const list = map.get(key) ?? [];
    list.push(marker);
    map.set(key, list);
  }

  return Array.from(map.entries()).sort(([keyA], [keyB]) => {
    const unknownDiff =
      (isUnknownGroupKey(keyA, by) ? 1 : 0) - (isUnknownGroupKey(keyB, by) ? 1 : 0);
    if (unknownDiff !== 0) return unknownDiff;
    const labelA = getGroupLabel(keyA, by, context, markers);
    const labelB = getGroupLabel(keyB, by, context, markers);
    return labelA.localeCompare(labelB);
  });
};

export type { RelationshipsPanelGroupBy, GroupLabelContext, GroupLabelDescriptor };
export {
  groupingOptions,
  getGroupKey,
  getGroupLabel,
  describeGroupLabel,
  getGroupColor,
  groupMarkers,
};
