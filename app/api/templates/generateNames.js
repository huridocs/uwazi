export default function (properties) {
  let names = properties.map((property) => property.name).filter((name) => !!name);

  return properties.map((property) => {
    if (!property.name) {
      let name = property.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      while (names.indexOf(name) !== -1) {
        let numberOfRepetition = parseInt(name.split('-')[1] || 1, 10);
        name = name.split('-')[0];
        name += '-' + (numberOfRepetition + 1);
      }

      names.push(name);
      property.name = name;
    }
    return property;
  });
}
