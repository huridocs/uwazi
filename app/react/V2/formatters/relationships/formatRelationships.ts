import type { RelationshipHubRow } from '#V2/api/relationships/types.js';
import { Pointer, RelationshipView, Selection } from './types.js';

type Rectangle = { top: number; left: number; width: number; height: number; page: string };

const toSelections = (rectangles: readonly Rectangle[]): Selection[] =>
  rectangles.map(rectangle => ({
    page: Number(rectangle.page),
    top: rectangle.top,
    left: rectangle.left,
    width: rectangle.width,
    height: rectangle.height,
  }));

const buildPointer = (connection: RelationshipHubRow): Pointer => {
  const base = {
    entity: connection.entity,
    entityTitle: connection.entityData.title,
    entityTemplateId: connection.entityData.template,
  };
  const rectangles = connection.reference?.selectionRectangles;

  if (rectangles?.length && connection.file) {
    return {
      ...base,
      type: 'textReference',
      file: String(connection.file),
      text: connection.reference?.text ?? '',
      selections: toSelections(rectangles),
    };
  }
  if (connection.file) {
    return { ...base, type: 'file', file: String(connection.file) };
  }
  return { ...base, type: 'entity' };
};

const buildRelationshipView = (
  selfSharedId: string,
  relations: readonly RelationshipHubRow[],
  target: RelationshipHubRow
): RelationshipView | undefined => {
  const source = relations.find(rel => rel.hub === target.hub && rel.entity === selfSharedId);
  if (!source) return undefined;

  const from = buildPointer(source);
  const to = buildPointer(target);
  const relationType = source.template ?? target.template;

  return {
    _id: String(target._id),
    hub: String(source.hub),
    type: relationType ? String(relationType) : '',
    from,
    to,
    relationTypeOnSelf: Boolean(source.template),
  };
};

const formatRelationships = (
  selfSharedId: string,
  hubRows: readonly RelationshipHubRow[]
): RelationshipView[] => {
  const targets = hubRows.filter(row => row.entity !== selfSharedId && row.entityData.template);

  return targets.flatMap(target => {
    const view = buildRelationshipView(selfSharedId, hubRows, target);
    return view ? [view] : [];
  });
};

export { formatRelationships };
