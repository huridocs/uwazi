import { has, uniq } from 'lodash';
import { EntityReference } from 'app/V2/domain/entities/types';
import { EntitySchema } from 'shared/types/entityType';
import { ConnectionSchema } from 'shared/types/connectionType';
import { AdapterReferences, ReferencesResult } from './types';

export class ReferencesProcessor {
  extractReferences(entities: EntitySchema[]): ReferencesResult {
    const adapterReferences: AdapterReferences = {};
    const templateIds: string[] = [];

    entities.forEach(entity => {
      const relations = Object.values(entity?.relations || []) as ConnectionSchema[];
      const references =
        relations.filter((relation: ConnectionSchema) => has(relation, 'reference')) || [];
      const referencesRelations: EntityReference[] = [];

      references.forEach((reference: ConnectionSchema) => {
        const relation = relations.find(
          (rel: ConnectionSchema) => rel._id !== reference._id && rel.hub === reference.hub
        );
        if (relation) {
          templateIds.push(relation.entityData?.template as string);
          referencesRelations.push({
            _id: relation._id as string,
            hub: relation.hub as string,
            file: reference.file as string,
            reference: {
              text: reference.reference?.text,
              selectionRectangles: reference.reference?.selectionRectangles,
            },
            targetEntity: {
              _id: relation._id as string,
              title: relation.entityData?.title || '',
              sharedId: relation.entity as string,
              template: {
                _id: relation.entityData?.template as string,
                name: relation.entityData?.template as string,
              },
            },
          });
        }
        adapterReferences[entity._id as string] = referencesRelations;
      });
    });

    return { references: adapterReferences, templateIds: uniq(templateIds) };
  }
}
