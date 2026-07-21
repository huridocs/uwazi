import { Entity, EntityRelation } from '#V2/api/entities/types.js';
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

const buildPointer = (
  connection: EntityRelation,
  entity: string,
  entityTitle: string,
  entityTemplateId: string
): Pointer => {
  const base = { entity, entityTitle, entityTemplateId };
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
  entity: Entity,
  relations: EntityRelation[],
  target: EntityRelation
): RelationshipView | undefined => {
  const targetTemplateId = target.entityData?.template;
  if (!targetTemplateId) return undefined;

  const source = relations.find(rel => rel.hub === target.hub && rel.entity === entity.sharedId);
  if (!source?._id || !source.hub) return undefined;

  const from = buildPointer(
    source,
    source.entity ?? entity.sharedId,
    source.entityData?.title ?? entity.title,
    source.entityData?.template ? String(source.entityData.template) : entity.template
  );
  const to = buildPointer(
    target,
    target.entity ?? '',
    target.entityData?.title ?? '',
    String(targetTemplateId)
  );
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

const formatRelationships = (entity: Entity): RelationshipView[] => {
  const relations = entity.relations ?? [];
  const targets = relations.filter(r => r.entity !== entity.sharedId && r.entityData?.template);

  return targets.flatMap(target => {
    const view = buildRelationshipView(entity, relations, target);
    return view ? [view] : [];
  });
};

export { formatRelationships };
