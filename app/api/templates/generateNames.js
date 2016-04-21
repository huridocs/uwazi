export default function (properties) {
  return properties.map((property) => {
    property.name = property.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return property;
  });
}
