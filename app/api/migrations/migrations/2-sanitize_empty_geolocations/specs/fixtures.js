export default {
  entities: [
    { title: 'doc1', metadata: { geolocation_geolocation: {}, description: 'one' } },
    { title: 'doc3' },
    {
      title: 'doc2',
      metadata: {
        geolocation_geolocation: {},
        other_geolocation: {},
        data_geolocation: { lat: 5, lon: 8 },
        description: 'two',
      },
    },
  ],
};
