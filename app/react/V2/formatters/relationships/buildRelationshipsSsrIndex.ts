import type { Entity } from '#V2/api/entities/types.js';
import { formatRelationships } from './formatRelationships.js';

const UNLABELED_TYPE_ID = 'no_label';

type RelationshipTypeName = {
  _id: string;
  name: string;
};

type RelationshipsSsrIndexEntity = {
  sharedId: string;
  title: string;
};

type RelationshipsSsrIndexGroup = {
  typeId: string;
  typeName: string;
  entities: RelationshipsSsrIndexEntity[];
};

const typeNameOf = (typeId: string, relationshipTypes: RelationshipTypeName[]): string => {
  if (!typeId || typeId === UNLABELED_TYPE_ID) return '';
  return relationshipTypes.find(type => type._id === typeId)?.name ?? typeId;
};

const buildRelationshipsSsrIndex = (
  entity: Entity,
  relationshipTypes: RelationshipTypeName[]
): RelationshipsSsrIndexGroup[] => {
  const groups = new Map<string, Map<string, string>>();

  formatRelationships(entity).forEach(view => {
    const sharedId = view.to.entity;
    const title = view.to.entityTitle;
    if (!sharedId || !title) return;

    const typeId = view.type || UNLABELED_TYPE_ID;
    const entities = groups.get(typeId) ?? new Map<string, string>();
    if (!entities.has(sharedId)) {
      entities.set(sharedId, title);
    }
    groups.set(typeId, entities);
  });

  return Array.from(groups.entries())
    .map(([typeId, entities]) => ({
      typeId,
      typeName: typeNameOf(typeId, relationshipTypes),
      entities: Array.from(entities.entries())
        .map(([sharedId, title]) => ({ sharedId, title }))
        .sort((a, b) => a.title.localeCompare(b.title) || a.sharedId.localeCompare(b.sharedId)),
    }))
    .sort((a, b) => {
      const unlabeledDiff =
        (a.typeId === UNLABELED_TYPE_ID ? 1 : 0) - (b.typeId === UNLABELED_TYPE_ID ? 1 : 0);
      if (unlabeledDiff !== 0) return unlabeledDiff;
      return a.typeName.localeCompare(b.typeName);
    });
};

export { buildRelationshipsSsrIndex, UNLABELED_TYPE_ID };
export type { RelationshipsSsrIndexEntity, RelationshipsSsrIndexGroup };
