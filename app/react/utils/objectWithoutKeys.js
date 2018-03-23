export default function (obj, keys = []) {
  const target = Object.assign({}, obj);

  keys.forEach((key) => {
    delete target[key];
  });

  return target;
}
