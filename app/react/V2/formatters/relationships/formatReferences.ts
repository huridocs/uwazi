import has from 'lodash/has.js';
import { Entity } from '#V2/api/entities/types.js';
import { ConnectionSchema } from '#shared/types/connectionType.js';
import { EntityReference } from './types.js';

const formatReferences = (entity: Entity): EntityReference[] => {
  const relations = Object.values(
    (entity as Record<string, unknown>).relations || []
  ) as ConnectionSchema[];

  const sourceConnections = relations.filter((relation: ConnectionSchema) =>
    has(relation, 'reference')
  );

  return sourceConnections.reduce<EntityReference[]>((acc, source) => {
    const target = relations.find(
      (rel: ConnectionSchema) => rel._id !== source._id && rel.hub === source.hub
    );

    if (!target?._id || !target.hub || !target.entityData?.template) {
      return acc;
    }

    acc.push({
      _id: String(target._id),
      hub: String(target.hub),
      file: source.file ? String(source.file) : '',
      reference: {
        text: source.reference?.text,
        selectionRectangles: source.reference?.selectionRectangles,
      },
      targetEntity: {
        _id: String(target._id),
        sharedId: target.entity || '',
        title: target.entityData?.title || '',
        templateId: String(target.entityData.template),
      },
    });

    return acc;
  }, []);
};

export { formatReferences };
