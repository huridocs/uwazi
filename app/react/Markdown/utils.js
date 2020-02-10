export const objectPath = (path, object) =>
  path.split('.').reduce((o, key) => {
    if (!o || !key) {
      return o;
    }
    return o.toJS ? o.get(key) : o[key];
  }, object);
