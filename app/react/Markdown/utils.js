export const objectPath = (path, object) => path.split('.').reduce((o, key) => {
  if (!o) {
    return;
  }
  return o.toJS ? o.get(key) : o[key];
}, object);
