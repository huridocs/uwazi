import Immutable from 'immutable';
import { ConnectionSchema } from 'shared/types/connectionType';

interface ConnectionGroup {
  key: string;
  templates: { _id: string }[];
}
interface RelationShip {
  template: string;
  relationships: ConnectionSchema[];
}
interface Hub {
  rightRelationships: RelationShip[];
}

export const filterVisibleConnections = (connectionsGroups: ConnectionGroup[], hubs: Hub[]) => {
  const filteredConnectionGroups = connectionsGroups
    .map(group => {
      const relationsForRelType: ConnectionSchema[] = [];
      hubs.forEach(hub => {
        hub.rightRelationships
          .filter(r => r.template === group.key)
          .forEach(r => {
            relationsForRelType.push(...r.relationships);
          });
      });

      if (!relationsForRelType.length) {
        return null;
      }

      const entityTemplates = relationsForRelType.map(
        (r: ConnectionSchema) => r.entityData?.template
      );

      const filteredTemplates = group.templates
        .map(temp => {
          if (entityTemplates.includes(temp._id)) {
            return temp;
          }
          return null;
        })
        .filter(temp => temp);

      return { ...group, templates: filteredTemplates };
    })
    .filter(g => g);
  return Immutable.fromJS(filteredConnectionGroups);
};
