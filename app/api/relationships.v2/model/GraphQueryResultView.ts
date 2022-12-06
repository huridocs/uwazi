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

  inheritedProperty?: string;

  constructor(inheritedProperty?: string) {
    this.inheritedProperty = inheritedProperty;
  }

  map(queryResult: GraphQueryResult): MappedResultValue[] {
    if (this.inheritedProperty === undefined) {
      return queryResult.map(entity => ({
        value: entity.sharedId,
        label: entity.title,
      }));
    }
    return queryResult.map(entity => ({
      value: entity.sharedId,
      label: entity.title,
      inheritedValue: entity[this.inheritedProperty],
      inheritedType: 'dummy', // TODO: figure out typing
    }));
  }
}

export type { GraphQueryResult, ResultViewTypes };
export { GraphQueryResultView };
