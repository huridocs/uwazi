/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, RenderResult, screen, waitFor } from '@testing-library/react';
import { Map } from 'app/Map';
import { renderConnectedContainer } from 'app/utils/test/renderConnected';
import * as MapHelper from 'app/Map/MapHelper';

jest.mock('app/Map/GoogleMapLayer', () => ({
  getGoogleLayer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useRouteError: () => () => undefined,
}));

describe('Map', () => {
  let renderResult: RenderResult;
  const storeState = {
    templates: Immutable.fromJS([{ _id: 't1', name: 'template1', color: 'blue' }]),
    translations: Immutable.fromJS([
      {
        locale: 'en',
        contexts: [{ id: 't1', values: { Title: 'Title translated' } }],
      },
    ]),
    settings: {
      collection: Immutable.fromJS({
        mapStartingPoint: [{ lat: 40, lon: 15 }],
        tilesProvider: 'mapbox',
        mapApiKey: 'abd',
      }),
    },
    locale: 'en',
  };

  const clickOnCluster = jest.fn();
  const onClick = jest.fn();

  const entity1 = { title: 'Entity 1', template: 't1', sharedId: 'entity1' };
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
      properties: { entity: entity1 },
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
    ({ renderResult } = renderConnectedContainer(
      <Map
        markers={markers}
        onClick={onClick}
        clickOnCluster={clickOnCluster}
        renderPopupInfo={renderPopupInfo}
        showControls={showControls}
      />,
      () => storeState
    ));
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
          'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/1/1/0?access_token=abd'
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
        const data = renderResult.container.getElementsByClassName('leaflet-pane')[0];
        fireEvent.click(data);
        expect(onClick).toHaveBeenCalled();
      });
    });
  });

  describe('render options', () => {
    it('should render controls if showControls is false', async () => {
      await waitFor(async () => {
        render([singleMarker], undefined, false);
        expect((await screen.queryAllByRole('radio')).length).toBe(0);
        expect((await screen.queryAllByRole('button')).length).toBe(0);
      });
    });
  });
});
