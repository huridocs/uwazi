import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { Entity, EntityRelation } from '#V2/api/entities/types.js';
import type {
  RelationshipAnchor,
  RelationshipHubRow,
  RelationshipQueryPayload,
  RelationshipResolved,
  RelationshipSummary,
  SelectionRect,
} from '#V2/api/relationships/types.js';
import type { DirectedRelationship } from '#V2/formatters/relationships/types.js';
import { httpRelationshipsQueryService } from '#V2/services/http/HttpRelationshipsQueryService.js';

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
): RelationshipSummary | undefined => {
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

const toAnchorRow = (row: EntityRelation, fileId?: string): RelationshipAnchor | undefined => {
  if (!row._id || !row.file || (fileId && row.file !== fileId)) return undefined;
  const first = row.reference?.selectionRectangles?.[0];
  if (!first) return undefined;
  return { _id: row._id, reference: { selectionRectangles: [toSelectionRect(first)] } };
};

const toResolvedRow = (row: EntityRelation): RelationshipResolved | undefined => {
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

const relationshipSummaryFromEntity = (entity: EntityQuerySource): RelationshipSummary[] =>
  (entity.relations ?? []).flatMap(row => {
    const next = toSummaryRow(row, entity);
    return next ? [next] : [];
  });

const relationshipAnchorsFromEntity = (
  entity: EntityQuerySource,
  fileId?: string
): RelationshipAnchor[] =>
  (entity.relations ?? []).flatMap(row => {
    const anchor = toAnchorRow(row, fileId);
    return anchor ? [anchor] : [];
  });

const relationshipQueryFromEntity = (
  entity: EntityQuerySource,
  fileId?: string
): RelationshipQueryPayload => {
  const summary = relationshipSummaryFromEntity(entity);
  const anchors = fileId ? relationshipAnchorsFromEntity(entity, fileId) : [];
  return {
    language: entity.language,
    sharedId: entity.sharedId,
    ...(fileId ? { fileId } : {}),
    hubRows: httpRelationshipsQueryService.compose(summary, fileId ? { anchors } : {}),
    anchorsLoaded: Boolean(fileId),
    seedRevision: 0,
  };
};

const relationshipResolvedFromEntity = (entity: EntityQuerySource): RelationshipResolved[] =>
  (entity.relations ?? []).flatMap(row => {
    const resolved = toResolvedRow(row);
    return resolved ? [resolved] : [];
  });

const relationshipHubRowsFromEntity = (entity: EntityQuerySource): RelationshipHubRow[] =>
  (entity.relations ?? []).flatMap(row => {
    const hubRow = toHubRow(row, entity);
    return hubRow ? [hubRow] : [];
  });

const directedRelationshipsFromEntity = (entity: EntityQuerySource): DirectedRelationship[] =>
  httpRelationshipsQueryService.toRelationships(
    entity.sharedId,
    relationshipHubRowsFromEntity(entity)
  );

const relationshipsQueryStubFromEntity = (entity: EntityQuerySource, fileId?: string) => ({
  loadSummary: async (): Promise<ApiResponse<RelationshipHubRow[] | undefined>> => [
    relationshipSummaryFromEntity(entity),
  ],
  loadAnchors: async (): Promise<ApiResponse<RelationshipAnchor[] | undefined>> => [
    relationshipAnchorsFromEntity(entity, fileId),
  ],
  loadResolved: async (): Promise<ApiResponse<RelationshipResolved[] | undefined>> => [
    relationshipResolvedFromEntity(entity),
  ],
});

export {
  relationshipQueryFromEntity,
  relationshipResolvedFromEntity,
  directedRelationshipsFromEntity,
  relationshipsQueryStubFromEntity,
};
