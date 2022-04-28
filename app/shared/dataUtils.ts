const deepEquals = (a: any, b: any): boolean => {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
  }

  if (a && b && (typeof a === 'object' || typeof b === 'object')) {
    if ((typeof a === 'object') !== (typeof b === 'object')) return false;

    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (!deepEquals(aKeys, bKeys)) return false;

    for (let i = 0; i < aKeys.length; i += 1) {
      const key = aKeys[i];
      if (!deepEquals(a[key], b[key])) return false;
    }
    return true;
  }

  return a === b;
};

export { deepEquals };
