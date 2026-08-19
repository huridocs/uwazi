import type { Entity, EntityRelation } from '#V2/api/entities/types.js';
import type {
  RelationshipAnchorRow,
  RelationshipHubRow,
  RelationshipQueryPayload,
  RelationshipResolvedRow,
  RelationshipSummaryRow,
  SelectionRect,
} from '#V2/api/relationships/types.js';

const toSelectionRect = (
  rectangle: NonNullable<NonNullable<EntityRelation['reference']>['selectionRectangles']>[number]
): SelectionRect => ({
  top: rectangle.top,
  left: rectangle.left,
  width: rectangle.width,
  height: rectangle.height,
  page: rectangle.page,
});

type EntityQuerySource = {
  language: string;
  sharedId: string;
  title: string;
  template: string;
  relations?: Entity['relations'];
};

const toSummaryRow = (
  row: EntityRelation,
  entity: EntityQuerySource
): RelationshipSummaryRow | undefined => {
  if (!row._id || !row.hub || !row.entity) return undefined;
  const title =
    row.entityData?.title ?? (row.entity === entity.sharedId ? entity.title : undefined);
  const template =
    row.entityData?.template ?? (row.entity === entity.sharedId ? entity.template : undefined);
  if (!title || !template) return undefined;
  return {
    _id: row._id,
    hub: row.hub,
    entity: row.entity,
    template: row.template ?? null,
    ...(row.file ? { file: row.file } : {}),
    entityData: { title, template },
  };
};

const toAnchorRow = (row: EntityRelation, fileId?: string): RelationshipAnchorRow | undefined => {
  if (!row._id || !row.file || (fileId && row.file !== fileId)) return undefined;
  const first = row.reference?.selectionRectangles?.[0];
  if (!first) return undefined;
  return { _id: row._id, reference: { selectionRectangles: [toSelectionRect(first)] } };
};

const toResolvedRow = (row: EntityRelation): RelationshipResolvedRow | undefined => {
  if (!row._id || row.reference?.text === undefined) return undefined;
  const rects = row.reference.selectionRectangles ?? [];
  return {
    _id: row._id,
    reference: {
      text: row.reference.text,
      selectionRectangles: rects.map(toSelectionRect),
    },
  };
};

const toHubRow = (
  row: EntityRelation,
  entity: EntityQuerySource
): RelationshipHubRow | undefined => {
  const summary = toSummaryRow(row, entity);
  if (!summary) return undefined;
  const rects = row.reference?.selectionRectangles;
  return {
    ...summary,
    ...(row.reference
      ? {
          reference: {
            ...(row.reference.text !== undefined ? { text: row.reference.text } : {}),
            ...(rects ? { selectionRectangles: rects.map(toSelectionRect) } : {}),
          },
        }
      : {}),
  };
};

const relationshipQueryFromEntity = (
  entity: EntityQuerySource,
  fileId?: string
): RelationshipQueryPayload => {
  const relations = entity.relations ?? [];
  return {
    language: entity.language,
    sharedId: entity.sharedId,
    ...(fileId ? { fileId } : {}),
    summary: relations.flatMap(row => {
      const summary = toSummaryRow(row, entity);
      return summary ? [summary] : [];
    }),
    anchors: relations.flatMap(row => {
      const anchor = toAnchorRow(row, fileId);
      return anchor ? [anchor] : [];
    }),
  };
};

const resolvedFromEntity = (entity: EntityQuerySource): RelationshipResolvedRow[] =>
  (entity.relations ?? []).flatMap(row => {
    const resolved = toResolvedRow(row);
    return resolved ? [resolved] : [];
  });

const hubRowsFromEntity = (entity: EntityQuerySource): RelationshipHubRow[] =>
  (entity.relations ?? []).flatMap(row => {
    const hubRow = toHubRow(row, entity);
    return hubRow ? [hubRow] : [];
  });

export { relationshipQueryFromEntity, resolvedFromEntity, hubRowsFromEntity };
