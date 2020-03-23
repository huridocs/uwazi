/** @format */

const geolocation = async (entityToImport, templateProperty) => {
  const [lat, lon] = entityToImport[templateProperty.name].split('|');
  if (lat && lon) {
    return [{ value: { lat, lon } }];
  }

  return null;
};

export default geolocation;
