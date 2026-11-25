/**
 * @jest-environment jsdom
 */
import Leaflet from 'leaflet';
import 'leaflet.markercluster';
import { createLeafletMap } from '../LMapSync.js';

jest.mock('../TilesProviderFactory', () => ({
  getMapProvider: () => ({
    Streets: { layer: {}, key: 'Streets' },
  }),
}));

const tileCount = (map: Leaflet.Map) => {
  let count = 0;
  map.eachLayer(layer => {
    if (layer instanceof Leaflet.TileLayer) count += 1;
  });
  return count;
};

describe('createLeafletMap', () => {
  it('does not throw when every configured layer is filtered out', () => {
    document.body.innerHTML = '<div id="empty-layers"></div>';
    const created = createLeafletMap({
      containerId: 'empty-layers',
      provider: 'mapbox',
      mapApiKey: 'key',
      layers: ['Dark'],
      startingPoint: [{ lat: 0, lon: 0 }],
      zoom: 6,
      showControls: true,
      shouldScroll: false,
      attributionControlRef: { current: null },
      markerState: {
        pointMarkers: [],
        deletedEntity: undefined,
        templatesInfo: {},
        renderPopupInfo: false,
        zoom: 6,
        syncKey: 'empty',
      },
      frameOnLoad: false,
      readOnClick: () => undefined,
    });

    expect(tileCount(created.map)).toBe(0);
    created.map.remove();
  });
});
