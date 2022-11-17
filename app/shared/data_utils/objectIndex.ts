import _ from 'lodash';

type IndexTypes = string | number;

function objectIndex<T, U>(
  dataArray: T[],
  indexingFunction: (data: T) => IndexTypes,
  dataTransformation: (data: T) => U
) {
  const grouped = _.groupBy(dataArray, indexingFunction);
  const transformed = Object.fromEntries(
    Object.entries(grouped).map(([key, [elem]]) => [key, dataTransformation(elem)])
  );
  return transformed;
}

objectIndex.NoTransform = <T>(elem: T) => elem;

export { objectIndex };
