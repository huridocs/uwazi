export default {
  parseNested(object) {
    if (typeof object !== 'object') {
      return object;
    }
    const result = { ...object };
    Object.keys(object).forEach(index => {
      try {
        result[index] = JSON.parse(object[index]);
      } catch (_) {
        result[index] = object[index];
      }
    });
    return result;
  },
};
