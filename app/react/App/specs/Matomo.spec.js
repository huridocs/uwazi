/**
 * @jest-environment jsdom
 */

import Immutable from 'immutable';
import React from 'react';
import { mount } from 'enzyme';
import { mapStateToProps, MatomoComponent } from '../Matomo';

describe('Matomo', () => {
  it.each`
    url       | id
    ${'url/'} | ${'id1'}
    ${'url'}  | ${'id2'}
  `('should include matomo script when url and id are set', ({ url, id }) => {
    window._paq = undefined;

    mount(<MatomoComponent url={url} id={id} />);
    expect(window._paq).toEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'url/piwik.php'],
      ['setSiteId', id],
    ]);
  });

  it('should not include script when id or url are not set', () => {
    window._paq = undefined;

    mount(<MatomoComponent />);
    expect(window._paq).toEqual(undefined);
  });

  it('should not pollute existing keys in the window object', () => {
    window._paq = [['googleTracker', 'idForTracker']];

    mount(<MatomoComponent url="url/" id="id" />);
    expect(window._paq).toEqual([
      ['googleTracker', 'idForTracker'],
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'url/piwik.php'],
      ['setSiteId', 'id'],
    ]);
  });

  describe('mapStateToProps', () => {
    it('should parse and map id and url', () => {
      const state = {
        settings: { collection: Immutable.fromJS({ matomoConfig: '{"id":"id", "url": "url"}' }) },
      };
      expect(mapStateToProps(state)).toEqual({ id: 'id', url: 'url' });
    });

    it('should not fail when json is malformed', () => {
      const state = {
        settings: { collection: Immutable.fromJS({ matomoConfig: '{\'id\':"id", "url": "url"}' }) },
      };
      expect(mapStateToProps(state)).toEqual({});
    });
  });
});
