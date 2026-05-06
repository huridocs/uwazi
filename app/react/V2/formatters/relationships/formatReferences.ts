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
    const partner = relations.find(
      (rel: ConnectionSchema) => rel._id !== source._id && rel.hub === source.hub
    );

    if (!partner?._id || !partner.hub || !partner.entityData?.template) {
      return acc;
    }

    acc.push({
      _id: String(partner._id),
      hub: String(partner.hub),
      file: source.file ? String(source.file) : '',
      reference: {
        text: source.reference?.text,
        selectionRectangles: source.reference?.selectionRectangles,
      },
      targetEntity: {
        _id: String(partner._id),
        sharedId: partner.entity || '',
        title: partner.entityData?.title || '',
        templateId: String(partner.entityData.template),
      },
    });

    return acc;
  }, []);
};

export { formatReferences };
