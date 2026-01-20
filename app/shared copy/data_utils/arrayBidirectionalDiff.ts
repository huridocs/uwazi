type IndexTypes = symbol | string | number;

export function arrayBidirectionalDiff<T, V = T>(
  a: T[],
  b: T[],
  valueCb: (o: T) => symbol | string | number,
  mapCb: (o: T) => V
) {
  const newMap: Record<IndexTypes, V> = {};
  const delMap: Record<IndexTypes, V> = {};

  b.forEach(item => {
    newMap[valueCb(item)] = mapCb(item);
  });

  a.forEach(item => {
    if (!newMap[valueCb(item)]) {
      delMap[valueCb(item)] = mapCb(item);
    }
    delete newMap[valueCb(item)];
  });

  return { added: Object.values(newMap), removed: Object.values(delMap) };
}
