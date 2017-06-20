export default function (obj, keys = []) {
  const target = {};
  for (let property in obj) {
    if (keys.indexOf(property) >= 0) {
      continue;
    }

    if (!Object.hasOwnProperty.call(obj, property)) {
      continue;
    }

    target[property] = obj[property];
  }
  return target;
}
