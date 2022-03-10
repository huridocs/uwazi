/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, waitFor } from '@testing-library/react';
import { Map } from 'app/Map';
import { renderConnectedContainer } from 'app/utils/test/renderConnected';

jest.mock('app/Map/GoogleMapLayer', () => ({
  getGoogleLayer: jest.fn(),
}));

jest.mock('shared/uniqueID', () => jest.fn(() => 'containerid'));

describe('Map', () => {
  const storeState = {
    templates: Immutable.fromJS([
      {
        _id: 't1',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
          { name: 'description', type: 'text' },
          { name: 'date', type: 'date' },
          { name: 'main_image', label: 'Main Image', type: 'image' },
        ],
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
        mapStartingPoint: [{ lat: 46, lon: 6 }],
        tilesProvider: 'mapbox',
        mapApiKey: 'abd',
      }),
    },
    locale: 'en',
  };

  const render = () => {
    renderConnectedContainer(
      <Map
        onClick={() => ({})}
        markers={[{ latitude: 65, longitude: 34, properties: { libraryMap: false } }]}
      />,
      () => storeState
    );
  };

  describe('render', () => {
    beforeEach(async () => {
      await waitFor(() => {
        render();
      });
    });
    it('should set the streets mapbox tile by default', async () => {
      const presentation = await screen.getByRole('presentation');
      // @ts-ignore
      expect(presentation.src).toEqual(
        'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/5/19/8?access_token=abd'
      );
      // @ts-ignore
      expect(presentation._leaflet_pos).toEqual({
        x: -11,
        y: -168,
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
  });
});
