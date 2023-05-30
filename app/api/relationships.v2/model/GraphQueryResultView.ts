import { Entity, MetadataValue } from 'api/entities.v2/model/Entity';

type GraphQueryResult = Entity[];

type BaseResultValue = {
  value: string;
  label: string;
};

type InheritedResultValue = BaseResultValue & {
  inheritedValue: MetadataValue[];
  inheritedType: string;
};

type MappedResultValue = BaseResultValue | InheritedResultValue;

class GraphQueryResultView {
  inheritedProperty?: { name: string; type: string };

  constructor(inheritedProperty?: { name: string; type: string }) {
    this.inheritedProperty = inheritedProperty;
  }

  private buildInheritedInformation(entity: Entity) {
    if (this.inheritedProperty) {
      return {
        inheritedValue: entity.metadata[this.inheritedProperty.name] ?? [],
        inheritedType: this.inheritedProperty.type,
      };
    }
    return {};
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
