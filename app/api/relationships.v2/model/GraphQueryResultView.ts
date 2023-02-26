import { Entity, MetadataValue } from 'api/entities.v2/model/Entity';

type GraphQueryResult = Entity[];

type MappedResultValue = {
  value: string;
  label: string;
  inheritedValue: MetadataValue[];
  inheritedType: string;
};

class GraphQueryResultView {
  inheritedProperty?: { name: string; type: string };

  constructor(inheritedProperty?: { name: string; type: string }) {
    this.inheritedProperty = inheritedProperty;
  }

  private buildInheritedInformation(entity: Entity) {
    if (this.inheritedProperty) {
      return {
        inheritedValue: entity.metadata[this.inheritedProperty.name],
        inheritedType: this.inheritedProperty.type,
      };
    }

    return {
      inheritedValue: [{ value: entity.title }],
      inheritedType: 'text',
    };
  }

  map(queryResult: GraphQueryResult): MappedResultValue[] {
    return queryResult.map(entity => ({
      value: entity.sharedId,
      label: entity.title,
      ...this.buildInheritedInformation(entity),
    }));
  }
}

export { GraphQueryResultView };
