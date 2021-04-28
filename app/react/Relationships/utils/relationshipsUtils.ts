export const filterVisibleConnections = (connectionsGroups: any, hubs: any) =>
  connectionsGroups
    .map((group: any) => {
      const relationsForRelType = hubs.reduce((memo: any, hub: any) => {
        const relations = hub
          .get('rightRelationships')
          .filter((r: any) => r.get('template') === group.get('key'))
          .reduce((memo2: any, r: any) => memo2.concat(r.get('relationships').toJS()), []);

        if (!relations.length) {
          return memo;
        }

        return memo.concat(relations);
      }, []);

      if (!relationsForRelType.length) {
        return null;
      }

      const entityTemplates = relationsForRelType.map((r: any) => r.entityData.template);

      const filteredTemplates = group
        .get('templates')
        .map((temp: any) => {
          if (entityTemplates.includes(temp.get('_id'))) {
            return temp;
          }
          return null;
        })
        .filter((temp: any) => temp);

      return group.set('templates', filteredTemplates);
    })
    .filter((g: any) => g);
