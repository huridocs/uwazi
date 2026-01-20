import has from 'lodash/has.js';
import uniq from 'lodash/uniq.js';
import { EntityReference } from '#V2/domain/entities/types.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { ConnectionSchema } from '#shared/types/connectionType.js';
import { AdapterReferences, ReferencesResult } from '#V2/application/services/processors/types.js';

export class ReferencesProcessor {
  extractReferences(entities: EntitySchema[]): ReferencesResult {
    const adapterReferences: AdapterReferences = {};
    const templateIds: string[] = [];

    entities.forEach(entity => {
      if (!entity._id) return;

      const relations = Object.values(entity?.relations || []) as ConnectionSchema[];
      const references = relations.filter((relation: ConnectionSchema) =>
        has(relation, 'reference')
      );
      const referencesRelations: EntityReference[] = [];

      references.forEach((reference: ConnectionSchema) => {
        const relation = relations.find(
          (rel: ConnectionSchema) => rel._id !== reference._id && rel.hub === reference.hub
        );
        if (relation && relation.entityData?.template && relation._id && relation.hub) {
          const templateId = String(relation.entityData.template);
          templateIds.push(templateId);
          referencesRelations.push({
            _id: String(relation._id),
            hub: String(relation.hub),
            file: reference.file ? String(reference.file) : '',
            reference: {
              text: reference.reference?.text,
              selectionRectangles: reference.reference?.selectionRectangles,
            },
            targetEntity: {
              _id: String(relation._id),
              title: relation.entityData?.title || '',
              sharedId: relation.entity || '',
              template: {
                _id: templateId,
                name: templateId,
              },
            },
          });
        }
      });

      if (referencesRelations.length > 0 && entity._id) {
        adapterReferences[String(entity._id)] = referencesRelations;
      }
    });

    return { references: adapterReferences, templateIds: uniq(templateIds) };
  }
}
