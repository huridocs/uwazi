import typeParsers from '../../typeParsers';

const rawEntityWithGeoValue = stringVal => ({
  propertiesFromColumns: {
    geolocation_prop: stringVal,
  },
});

describe('geolocation parser', () => {
  it('should build a geolocation type object', async () => {
    const templateProp = { name: 'geolocation_prop' };
    const rawEntity = rawEntityWithGeoValue('1.5|45.65');

    expect(await typeParsers.geolocation(rawEntity, templateProp)).toEqual([
      { value: { lat: 1.5, lon: 45.65, label: '' } },
    ]);
  });

  it('should work on 0 values', async () => {
    const templateProp = { name: 'geolocation_prop' };
    const rawEntity = rawEntityWithGeoValue('0|0');

    expect(await typeParsers.geolocation(rawEntity, templateProp)).toEqual([
      { value: { lat: 0, lon: 0, label: '' } },
    ]);
  });

  describe('when there is only one value', () => {
    it('should return empty array', async () => {
      const templateProp = { name: 'geolocation_prop' };
      const rawEntity = rawEntityWithGeoValue('oneValue');

      expect(await typeParsers.geolocation(rawEntity, templateProp)).toEqual([]);
    });
  });
});
