import _ from 'lodash';

const enum IndexTargetTypes {
  one = 'one',
  array = 'array',
  set = 'set',
}

type IndexTypes = string | number;

const IndexTargetTransformations = {
  one: (group: any[]) => (group.length ? group[0] : undefined),
  array: (group: any[]) => group,
  set: (group: any[]) => new Set(group),
};

function objectIndex(
  dataArray: any[],
  indexingFunction: (data: any) => IndexTypes,
  dataTransformation: (data: any) => any = (data: any) => data,
  targetType: IndexTargetTypes = IndexTargetTypes.one
) {
  // const  = IndexTargetTransformations[targetType];
  const grouped = _.groupBy(dataArray, indexingFunction);
  const transformed = Object.fromEntries(
    Object.entries(grouped).map(([key, group]) => [
      key,
      IndexTargetTransformations[targetType](group.map(value => dataTransformation(value))),
    ])
  );
  return transformed;
}

export { IndexTargetTypes, objectIndex };
