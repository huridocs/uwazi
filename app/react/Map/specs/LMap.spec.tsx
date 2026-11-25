/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { createStore, Provider } from 'jotai';
import {
  fireEvent,
  RenderResult,
  screen,
  waitFor,
  render as renderComponent,
} from '@testing-library/react';

import Leaflet from 'leaflet';
import { Map } from '#app/Map/index.jsx';
import * as MapHelper from '#app/Map/MapHelper.jsx';
import {
  deletedEntityAtom,
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
} from '#V2/atoms/index.js';

jest.mock('#app/Map/GoogleMapLayer', () => ({
  getGoogleLayer: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useRouteError: () => () => undefined,
}));

const actualLeafletMap = jest.requireActual<typeof import('leaflet')>('leaflet').map;

const markerAt = (map: Leaflet.Map, lat: number, lng: number) => {
  let found = false;
  const visit = (layer: Leaflet.Layer) => {
    if (layer instanceof Leaflet.Marker) {
      const position = layer.getLatLng();
      found = found || (position.lat === lat && position.lng === lng);
    } else if (layer instanceof Leaflet.LayerGroup) layer.eachLayer(visit);
  };
  map.eachLayer(visit);
  return found;
};

describe('Map', () => {
  let renderResult: RenderResult;
  const testStore = createStore();
  testStore.set(templatesAtom, [{ _id: 't1', name: 'template1', color: 'blue' }]);
  testStore.set(translationsAtom, [
    {
      locale: 'en',
      contexts: [{ id: 't1', values: { Title: 'Title translated' } }],
    },
  ]);
  testStore.set(settingsAtom, {
    mapStartingPoint: [{ lat: 40, lon: 15 }],
    tilesProvider: 'mapbox',
    mapApiKey: 'abd',
  });
  testStore.set(localeAtom, 'en');

  const clickOnCluster = jest.fn();
  const onClick = jest.fn();

  const entity1 = { title: 'Entity 1', template: 't1', sharedId: 'entity1' };
  const entity2 = { title: 'Entity 2', template: 't1', sharedId: 'entity2' };
  const clusterMarkers: MapHelper.MarkerInput[] = [
    {
      latitude: 60,
      longitude: 27,
      properties: { entity: entity1 },
      label: 'property1',
    },
    {
      latitude: 59,
      longitude: 29,
      properties: { entity: entity1 },
      label: 'property1',
    },
    {
      latitude: 58,
      longitude: 30,
      properties: { entity: entity2 },
      label: 'property1',
    },
  ];

  const singleMarker = {
    latitude: 60,
    longitude: 24,
    label: 'geolocation1',
    properties: {},
  };

  const render = (
    markers: MapHelper.MarkerInput[],
    renderPopupInfo?: boolean,
    showControls = true
  ) => {
    renderResult = renderComponent(
      <Provider store={testStore}>
        <Map
          markers={markers}
          onClick={onClick}
          clickOnCluster={clickOnCluster}
          renderPopupInfo={renderPopupInfo}
          showControls={showControls}
        />
      </Provider>
    );
  };

  describe('default values map library', () => {
    beforeEach(async () => {
      await waitFor(async () => {
        await render(clusterMarkers, true);
      });
    });

    it('should set the streets mapbox tile by default', async () => {
      await waitFor(async () => {
        const presentation = renderResult.container.querySelector('.leaflet-tile') as HTMLElement;
        // @ts-ignore
        expect(presentation.src).toEqual(
          'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/1/1/0?access_token=abd'
        );
        // @ts-ignore
        expect(presentation._leaflet_pos).toEqual({
          x: -81,
          y: -303,
        });
      });
    });

    it('should allow to change between map styles', async () => {
      expect((await screen.findAllByRole('radio')).length).toBe(4);
      expect(await screen.getByRole('radio', { name: 'Dark' })).not.toBeUndefined();
      expect(await screen.getByRole('radio', { name: 'Streets' })).not.toBeUndefined();
      expect(await screen.getByRole('radio', { name: 'Satellite' })).not.toBeUndefined();
      expect(await screen.getByRole('radio', { name: 'Hybrid' })).not.toBeUndefined();
    });

    it('should render the zoom buttons', async () => {
      const zoomButtons = await screen.findAllByRole('button');
      // @ts-ignore
      expect(zoomButtons[2].text).toEqual('+');
      // @ts-ignore
      expect(zoomButtons[3].text).toEqual('−');
    });
    it('should call clickOnCluster when clicking on a cluster', async () => {
      await waitFor(async () => {
        const cluster = await screen.getByText('3');
        fireEvent.click(cluster);
        expect(clickOnCluster).toHaveBeenCalled();
      });
    });
    it('should call onClick when clicking somewhere on the map', async () => {
      await waitFor(async () => {
        const [data] = renderResult.container.getElementsByClassName('leaflet-pane');
        fireEvent.click(data);
        expect(onClick).toHaveBeenCalled();
      });
    });
  });
  describe('deleted entities', () => {
    it('should not show entities marked as deleted', async () => {
      testStore.set(deletedEntityAtom, 'entity2');
      await waitFor(async () => {
        await render(clusterMarkers, true);
        const cluster = await screen.getByText('2');
        expect(cluster).toBeInTheDocument();
        expect(screen.queryByText('3')).not.toBeInTheDocument();
      });
    });
  });
  describe('render options', () => {
    const trackedMaps: Leaflet.Map[] = [];
    const trackMaps = () => {
      trackedMaps.length = 0;
      jest.spyOn(Leaflet, 'map').mockImplementation((element, options) => {
        const map = actualLeafletMap(element, options);
        trackedMaps.push(map);
        return map;
      });
    };
    const view = (markers: MapHelper.MarkerInput[], recenterRequest?: number) => (
      <Provider store={testStore}>
        <Map markers={markers} onClick={onClick} showControls recenterRequest={recenterRequest} />
      </Provider>
    );
    const moved = (latitude: number, longitude: number) => ({
      ...singleMarker,
      latitude,
      longitude,
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('should update markers when values change even with onClick', async () => {
      testStore.set(deletedEntityAtom, '');
      const { rerender } = renderComponent(
        <Provider store={testStore}>
          <Map
            markers={clusterMarkers}
            onClick={onClick}
            clickOnCluster={clickOnCluster}
            renderPopupInfo
          />
        </Provider>
      );
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
      rerender(
        <Provider store={testStore}>
          <Map
            markers={clusterMarkers.slice(0, 2)}
            onClick={onClick}
            clickOnCluster={clickOnCluster}
            renderPopupInfo
          />
        </Provider>
      );
      await waitFor(() => {
        expect(screen.queryByText('3')).not.toBeInTheDocument();
      });
    });
    it('should keep the leaflet container when markers are the same values', async () => {
      const { container, rerender } = renderComponent(
        <Provider store={testStore}>
          <Map
            markers={[...clusterMarkers]}
            onClick={onClick}
            clickOnCluster={clickOnCluster}
            renderPopupInfo
          />
        </Provider>
      );
      await waitFor(() => {
        expect(container.querySelector('.leafletmap')).toBeTruthy();
      });
      const mapId = container.querySelector('.leafletmap')?.id;
      rerender(
        <Provider store={testStore}>
          <Map
            markers={[...clusterMarkers]}
            onClick={onClick}
            clickOnCluster={clickOnCluster}
            renderPopupInfo
          />
        </Provider>
      );
      expect(container.querySelector('.leafletmap')?.id).toBe(mapId);
    });
    it('keeps the current zoom when the marker moves and recenters once when asked', async () => {
      testStore.set(deletedEntityAtom, '');
      trackMaps();
      const fitBounds = jest.spyOn(Leaflet.Map.prototype, 'fitBounds');
      const { rerender } = renderComponent(view([singleMarker]));
      await waitFor(() => expect(trackedMaps.length).toBeGreaterThan(0));
      expect(fitBounds).toHaveBeenCalled();
      trackedMaps[0].setZoom(12);
      fitBounds.mockClear();
      rerender(view([moved(12, 44)]));
      await waitFor(() => expect(markerAt(trackedMaps[0], 12, 44)).toBe(true));
      expect(trackedMaps[0].getZoom()).toBe(12);
      expect(fitBounds).not.toHaveBeenCalled();
      rerender(view([moved(3, 8)], 1));
      await waitFor(() => expect(fitBounds).toHaveBeenCalledTimes(1));
      trackedMaps[0].panTo([20, 20]);
      fitBounds.mockClear();
      rerender(view([moved(3, 8)], 2));
      await waitFor(() => expect(fitBounds).toHaveBeenCalledTimes(1));
      fitBounds.mockClear();
      rerender(view([moved(1, 2)]));
      await waitFor(() => expect(markerAt(trackedMaps[0], 1, 2)).toBe(true));
      expect(fitBounds).not.toHaveBeenCalled();
    });
    it('keeps the configured zoom when framing was not requested', async () => {
      testStore.set(deletedEntityAtom, '');
      trackMaps();
      const fitBounds = jest.spyOn(Leaflet.Map.prototype, 'fitBounds');
      renderComponent(view([singleMarker], 0));
      await waitFor(() => expect(trackedMaps.length).toBeGreaterThan(0));
      expect(fitBounds).not.toHaveBeenCalled();
      expect(trackedMaps[0].getZoom()).toBe(6);
    });
    it('should render controls if showControls is false', async () => {
      render([singleMarker], undefined, false);
      await waitFor(() => {
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        expect(screen.queryAllByRole('button')).toHaveLength(0);
      });
    });
  });
});
