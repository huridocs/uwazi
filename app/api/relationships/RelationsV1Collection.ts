import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';

export type Relation = {
  hub: { toString(): string };
  entity: string;
  template: { toString(): string };
  entityData: {
    template: { toString(): string };
    title: string;
  };
};

export class RelationsV1Collection extends Array<Relation> {
  private relationsByHub: { [hubId: string]: Relation[] } = {};

  constructor(relations: Relation[]) {
    if (Array.isArray(relations)) {
      super(...relations);
    } else {
      super(relations);
    }
  }

  private getEntityHubs(sharedId: string) {
    return this.filter(r => r.entity === sharedId).map(r => r.hub.toString());
  }

  public getEntityRelations(sharedId: string) {
    if (Object.keys(this.relationsByHub).length === 0) {
      this.relationsByHub = this.reduce<{ [hubId: string]: Relation[] }>((acc, relation) => {
        const hubId = relation.hub.toString();
        if (!acc[hubId]) {
          acc[hubId] = [];
        }
        acc[hubId].push(relation);
        return acc;
      }, {});
    }
    return new RelationsV1Collection(
      this.getEntityHubs(sharedId).flatMap(hub => this.relationsByHub[hub] || [])
    );
  }

  public getRelationsBelongingToProperty(property: V1RelationshipProperty) {
    return new RelationsV1Collection(
      this.filter(
        r =>
          r.template?.toString() === property.relationType?.toString() &&
          (!property.content || r.entityData.template.toString() === property.content)
      )
    );
  }

  public uniqueByEntity() {
    return new RelationsV1Collection(
      this.filter(
        (relation, index, self) => index === self.findIndex(r => r.entity === relation.entity)
      )
    );
  }
}
