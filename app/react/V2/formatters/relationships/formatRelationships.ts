import has from 'lodash/has.js';
import { Entity } from '#V2/api/entities/types.js';
import { ConnectionSchema } from '#shared/types/connectionType.js';
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
  connection: ConnectionSchema,
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

const formatRelationships = (entity: Entity): RelationshipView[] => {
  const relations = Object.values(
    (entity as Record<string, unknown>).relations || []
  ) as ConnectionSchema[];

  const sources = relations.filter(
    r => has(r, 'reference') || (!has(r, 'reference') && r.entity === entity.sharedId)
  );

  return sources.reduce<RelationshipView[]>((acc, source) => {
    const target = relations.find(rel => rel._id !== source._id && rel.hub === source.hub);

    if (!target?._id || !target.hub || !target.entityData?.template) {
      return acc;
    }

    const from = buildPointer(
      source,
      source.entity ?? entity.sharedId,
      source.entityData?.title ?? entity.title,
      source.entityData?.template ? String(source.entityData.template) : entity.template
    );
    const to = buildPointer(
      target,
      target.entity ?? '',
      target.entityData.title ?? '',
      String(target.entityData.template)
    );

    const relationType = source.template ?? target.template;

    acc.push({
      _id: String(target._id),
      type: relationType ? String(relationType) : '',
      from,
      to,
    });

    return acc;
  }, []);
};

export { formatRelationships };
