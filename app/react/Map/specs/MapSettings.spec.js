import settings from 'api/settings';
import { prepareMapStyleJson } from '../MapSettings';

jest.mock('api/settings');

describe('prepareMapStyleJson', () => {
  let mapStyle;
  const style = {
    sources: {
      openmaptiles: {
        url: 'https://api.maptiler.com/tiles/v3/tiles.json?key={{MAP_TILER_KEY}}',
      },
    },
    glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key={{MAP_TILER_KEY}}',
  };
  it('should not contains variables templates', async () => {
    expect(
      mapStyle
        .get('sources')
        .get('openmaptiles')
        .get('url')
    ).toEqual(expect.not.stringContaining('{{MAP_TILER_KEY}}'));
  });
  it('should set the map tiler key from the settings if it exists', async () => {
    const expectedKey = 'XYZ';

    settings.get.mockResolvedValue({ mapTilesKey: expectedKey });
    mapStyle = await prepareMapStyleJson(style);

    expect(
      mapStyle
        .get('sources')
        .get('openmaptiles')
        .get('url')
    ).toEqual(expect.stringContaining(expectedKey));
  });
});
