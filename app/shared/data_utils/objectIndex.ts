const enum IndexTargetTypes {
  one = 'one',
  array = 'array',
  set = 'set',
}

type IndexTypes = string | number;

const IndexTargetImplementations = {
  one: {
    default: () => undefined,
    add: (indexed: any, key: IndexTypes, data: any) => {
      if (!indexed[key]) indexed[key] = data;
    },
  },
  array: {
    default: () => [],
    add: (indexed: any, key: IndexTypes, data: any) => {
      indexed[key].push(data);
    },
  },
  set: {
    default: () => new Set(),
    add: (indexed: any, key: IndexTypes, data: any) => {
      indexed[key].add(data);
    },
  },
};

function objectIndex(
  dataArray: any[],
  indexingFunction: (data: any) => IndexTypes,
  dataTransformation: (data: any) => any = (data: any) => data,
  targetType: IndexTargetTypes = IndexTargetTypes.one
) {
  const target = IndexTargetImplementations[targetType];
  const indexed: {
    [k in IndexTypes]: any;
  } = {};
  dataArray.forEach(data => {
    const key = indexingFunction(data);
    const value = dataTransformation(data);
    if (!(key in indexed)) indexed[key] = target.default();
    target.add(indexed, key, value);
  });
  return indexed;
}

export { IndexTargetTypes, objectIndex };
