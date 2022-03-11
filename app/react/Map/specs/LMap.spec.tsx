/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, RenderResult, screen, waitFor } from '@testing-library/react';
import { Map } from 'app/Map';
import { renderConnectedContainer } from 'app/utils/test/renderConnected';
import { MarkerInput } from 'app/Map/MapHelper';

jest.mock('app/Map/GoogleMapLayer', () => ({
  getGoogleLayer: jest.fn(),
}));

jest.mock('shared/uniqueID', () => jest.fn(() => 'containerid'));

describe('Map', () => {
  let renderResult: RenderResult;
  const storeState = {
    templates: Immutable.fromJS([
      {
        _id: 't1',
        name: 'template1',
        color: 'blue',
      },
    ]),
    translations: Immutable.fromJS([
      {
        locale: 'en',
        contexts: [
          {
            id: 't1',
            values: { Title: 'Title translated', 'Main Image': 'Main Image translated' },
          },
        ],
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

  const clusterMarkers: MarkerInput[] = [
    {
      latitude: 60,
      longitude: 24,
      properties: { entity: { title: 'entity2', template: 't1' } },
      label: 'geolocation1',
    },
    {
      latitude: 40,
      longitude: 15,
      properties: { entity: { title: 'entity2', template: 't1' } },
      label: 'geolocation2',
    },
    {
      latitude: -0.5,
      longitude: 40,
      properties: { entity: { title: 'entity2', template: 't1' } },
      label: 'geolocation2',
    },
  ];

  const render = (markers: MarkerInput[], renderPopupInfo?: () => void) => {
    ({ renderResult } = renderConnectedContainer(
      <Map
        markers={markers}
        onClick={onClick}
        clickOnCluster={clickOnCluster}
        renderPopupInfo={renderPopupInfo}
      />,
      () => storeState
    ));
  };

  describe('render', () => {
    beforeEach(async () => {
      await waitFor(() => {
        const renderPopupInfo = () => {};
        render(clusterMarkers, renderPopupInfo);
      });
    });

    it('should set the streets mapbox tile by default', async () => {
      const presentation = await screen.getByRole('presentation');
      // @ts-ignore
      expect(presentation.src).toEqual(
        'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/-1/0/0?access_token=abd'
      );
      // @ts-ignore
      expect(presentation._leaflet_pos).toEqual({
        x: -148,
        y: -101,
      });
    });

    it('should allow to change between map styles', async () => {
      expect((await screen.findAllByRole('radio')).length).toBe(3);
      expect(await screen.getByRole('radio', { name: 'Streets' })).not.toBeUndefined();
      expect(await screen.getByRole('radio', { name: 'Satellite' })).not.toBeUndefined();
      expect(await screen.getByRole('radio', { name: 'Hybrid' })).not.toBeUndefined();
    });

    it('should render the zoom buttons', async () => {
      const zoomButtons = await screen.findAllByRole('button');
      // @ts-ignore
      expect(zoomButtons[0].text).toEqual('+');
      // @ts-ignore
      expect(zoomButtons[1].text).toEqual('−');
    });

    it('should call clickOnCluster when clicking on a cluster', async () => {
      const cluster = await screen.getByText('3');
      fireEvent.click(cluster);
      expect(clickOnCluster).toHaveBeenCalled();
    });

    it('should call onClick when clicking somewhere on the map', async () => {
      const data = renderResult.container.getElementsByClassName('leaflet-pane')[0];
      fireEvent.click(data);
      expect(onClick).toHaveBeenCalled();
    });
  });
});
