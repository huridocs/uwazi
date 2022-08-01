const arrayDeepEquals = (a: Array<any>, b: Array<any>): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!deepEquals(a[i], b[i])) return false;
  }
  return true;
};

const objectDeepEquals = (a: any, b: any): boolean => {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (!arrayDeepEquals(aKeys, bKeys)) return false;

  for (let i = 0; i < aKeys.length; i += 1) {
    const key = aKeys[i];
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!deepEquals(a[key], b[key])) return false;
  }
  return true;
};

const deepEquals = (a: any, b: any): boolean => {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    return arrayDeepEquals(a, b);
  }

  if (a && b && (typeof a === 'object' || typeof b === 'object')) {
    if ((typeof a === 'object') !== (typeof b === 'object')) return false;
    return objectDeepEquals(a, b);
  }

  return a === b;
};

export { deepEquals };
