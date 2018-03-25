export default {
  parseNested(object) {
    if (typeof object !== 'object') {
      return object;
    }
    const result = Object.assign({}, object);
    Object.keys(object).forEach((index) => {
      try {
        result[index] = JSON.parse(object[index]);
      } catch (e) {
        result[index] = object[index];
      }
    });
    return result;
  }
};
