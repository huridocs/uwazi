type ArrayOrSet<T> = Set<T> | Array<T>;

function setsEqual<T>(_set1: ArrayOrSet<T>, _set2: ArrayOrSet<T>): boolean {
  const set1 = _set1 instanceof Set ? _set1 : new Set(_set1);
  const set2 = _set2 instanceof Set ? _set2 : new Set(_set2);
  if (set1.size !== set2.size) {
    return false;
  }
  const set1Array = Array.from(set1);
  for (let i = 0; i < set1Array.length; i += 1) {
    if (!set2.has(set1Array[i])) {
      return false;
    }
  }
  return true;
}

function setIntersection<T>(_set1: ArrayOrSet<T>, _set2: ArrayOrSet<T>): Set<T> {
  const set1 = _set1 instanceof Set ? _set1 : new Set(_set1);
  const set2 = _set2 instanceof Set ? _set2 : new Set(_set2);
  const intersection = new Set<T>();
  set1.forEach(value => {
    if (set2.has(value)) {
      intersection.add(value);
    }
  });
  return intersection;
}

export { setsEqual, setIntersection };
