

export default class Changes extends Array {
  removeOtherLanguageTextReferences(connectedDocuments) {
    return this.filter((r) => {
      if (r.filename) {
        const filename = connectedDocuments[r.entity].file ? connectedDocuments[r.entity].file.filename : '';
        return r.filename === filename;
      }
      return true;
    });
  }

  // removeOrphanHubsOf(sharedId) {
  //   const hubs = groupByHubs(this).filter(h => h.map(r => r.entity).includes(sharedId));
  //   return new RelationshipCollection(...Array.prototype.concat(...hubs));
  // }

  // removeSingleHubs() {
  //   const hubRelationshipsCount = this.reduce((data, r) => {
  //     data[r.hub.toString()] = data[r.hub.toString()] ? data[r.hub.toString()] + 1 : 1; //eslint-disable-line no-param-reassign
  //     return data;
  //   }, {});

  //   return this.filter(r => hubRelationshipsCount[r.hub.toString()] > 1);
  // }

  // withConnectedData(connectedDocuments) {
  //   return this.map(relationship => ({
  //     template: null,
  //     entityData: connectedDocuments[relationship.entity],
  //     ...relationship,
  //   }));
  // }
}
