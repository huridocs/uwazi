import _ from 'lodash';

type IndexTypes = string | number;

function objectIndex<T, U>(
  dataArray: T[],
  indexingFunction: (data: T) => IndexTypes,
  dataTransformation: (data: T) => U
): Record<IndexTypes, U> {
  const grouped = _.groupBy(dataArray, indexingFunction);
  const transformed = Object.fromEntries(
    Object.entries(grouped).map(([key, [elem]]) => [key, dataTransformation(elem)])
  );
  return transformed;
}

function objectIndexToArrays<T, U>(
  dataArray: T[],
  indexingFunction: (data: T) => IndexTypes,
  dataTransformation: (data: T) => U
): Record<IndexTypes, U[]> {
  const grouped = _.groupBy(dataArray, indexingFunction);
  const transformed = Object.fromEntries(
    Object.entries(grouped).map(([key, elems]) => [key, elems.map(dataTransformation)])
  );
  return transformed;
}

function objectIndexToSets<T, U>(
  dataArray: T[],
  indexingFunction: (data: T) => IndexTypes,
  dataTransformation: (data: T) => U
): Record<IndexTypes, Set<U>> {
  const grouped = _.groupBy(dataArray, indexingFunction);
  const transformed = Object.fromEntries(
    Object.entries(grouped).map(([key, elems]) => [key, new Set(elems.map(dataTransformation))])
  );
  return transformed;
}

objectIndex.NoTransform = <T>(elem: T) => elem;

export { objectIndex, objectIndexToArrays, objectIndexToSets };
