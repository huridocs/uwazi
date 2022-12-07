import { Entity, MetadataValue } from 'api/entities.v2/model/Entity';

type GraphQueryResult = Entity[];

enum ResultViewTypes {
  leaf = 'leaf',
}

type MappedResultValue = {
  value: string;
  label: string;
  inheritedValue?: MetadataValue[];
  inheritedType?: string;
};

class GraphQueryResultView {
  type: ResultViewTypes = ResultViewTypes.leaf;

  inheritedProperty?: { name: string; type: string };

  constructor(inheritedProperty?: { name: string; type: string }) {
    this.inheritedProperty = inheritedProperty;
  }

  map(queryResult: GraphQueryResult): MappedResultValue[] {
    if (this.inheritedProperty) {
      const { name, type } = this.inheritedProperty;
      return queryResult.map(entity => ({
        value: entity.sharedId,
        label: entity.title,
        inheritedValue: entity.metadata[name],
        inheritedType: type,
      }));
    }
    return queryResult.map(entity => ({
      value: entity.sharedId,
      label: entity.title,
    }));
  }
}

export type { GraphQueryResult, ResultViewTypes };
export { GraphQueryResultView };
