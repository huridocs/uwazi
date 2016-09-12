export default {
  parseNested(object) {
    Object.keys(object).forEach((index) => {
      try {
        object[index] = JSON.parse(object[index]);
      } catch (e) {}
    });
    return object;
  }
};
