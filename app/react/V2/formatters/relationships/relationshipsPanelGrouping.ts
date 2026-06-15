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

const groupingOptions: { id: RelationshipsPanelGroupBy; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'target-template', label: 'Target template' },
  { id: 'target-entity', label: 'Target entity' },
  { id: 'source-template', label: 'Source template' },
  { id: 'source-entity', label: 'Source entity' },
  { id: 'relation-type', label: 'Relation type' },
  { id: 'direction', label: 'Direction' },
  { id: 'source-page', label: 'Source page' },
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

const getGroupLabel = (
  key: string,
  by: RelationshipsPanelGroupBy,
  context: GroupLabelContext,
  markers: RelationshipMarker[]
): string => {
  switch (by) {
    case 'target-template':
    case 'source-template':
      return context.templateName(key) || 'Unknown template';
    case 'target-entity':
      return (
        markers.find(marker => marker.target.sharedId === key)?.target.title ?? 'Unknown entity'
      );
    case 'source-entity':
      return context.selfTitle;
    case 'relation-type':
      return context.relationshipTypeName(key) || key;
    case 'direction':
      if (key === 'both') return 'Bidirectional';
      if (key === 'incoming') return 'Incoming';
      return 'Outgoing';
    case 'source-page':
      return key === 'no-page' ? 'No page' : `Page ${key}`;
    case 'none':
    default:
      return key;
  }
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

export type { RelationshipsPanelGroupBy, GroupLabelContext };
export { groupingOptions, getGroupKey, getGroupLabel, getGroupColor, groupMarkers };
