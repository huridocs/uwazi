export const objectPath = (path, object) =>
  path.split('.').reduce((o, key) => {
    if (!o || !key) {
      return o;
    }
    return o.toJS ? o.get(key) : o[key];
  }, object);

export const logError = (err, propValueOf, propLabelOf) => {
  /* eslint-disable no-console */
  console.error('Error on EntityData: ');
  console.error('value-of: ', propValueOf, '; label-of: ', propLabelOf);
  console.error(err);
  /* eslint-enable no-console */
};
