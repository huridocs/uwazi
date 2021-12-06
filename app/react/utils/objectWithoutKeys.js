export default function (obj, keys = []) {
  const target = { ...obj };

  keys.forEach(key => {
    delete target[key];
  });

  return target;
}
