const geolocation = async (entityToImport, templateProperty) => {
  const [lat, lon] = entityToImport[templateProperty.name].split('|');
  if (lat && lon) {
    return [{ value: { lat: Number(lat), lon: Number(lon), label: '' } }];
  }

  return [];
};

export default geolocation;
