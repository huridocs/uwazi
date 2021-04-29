import Immutable from 'immutable';

interface ConnectionGroup {
  key: string;
  templates: { _id: string; count: number }[];
}

interface RelationshipData {
  entityData: { template: string };
}

interface RelationShip {
  template: string;
  relationships: RelationshipData[];
}
interface Hub {
  rightRelationships: RelationShip[];
}

export const filterVisibleConnections = (connectionsGroups: ConnectionGroup[], hubs: Hub[]) => {
  const filteredConnectionGroups = connectionsGroups
    .map(group => {
      const relationsForRelType: RelationshipData[] = [];
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

      const entityTemplates = relationsForRelType.map(r => r.entityData.template);

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
