/**
 * @jest-environment jsdom
 */

import Immutable from 'immutable';
import React from 'react';
import { mount } from 'enzyme';
import { mapStateToProps, MatomoComponent } from '../Matomo';

describe('Matomo', () => {
  let props;

  beforeEach(() => {
    props = {
      url: 'url/',
      id: 'id',
    };
  });

  it('should include matomo script when url and id are set', () => {
    delete window._paq;
    mount(<MatomoComponent {...props} />);
    expect(window._paq).toEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'url/piwik.php'],
      ['setSiteId', 'id'],
    ]);
  });

  it('should add "/" at the end of url when not set', () => {
    delete window._paq;
    props.url = 'url';
    mount(<MatomoComponent {...props} />);
    expect(window._paq).toEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'url/piwik.php'],
      ['setSiteId', 'id'],
    ]);
  });

  it('should not include script when id or url are not set', () => {
    delete window._paq;
    props = {};
    mount(<MatomoComponent {...props} />);
    expect(window._paq).toEqual(undefined);
  });

  it('should not pollute existing keys in the window object', () => {
    window._paq = [['googleTracker', 'idForTracker']];
    mount(<MatomoComponent {...props} />);
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
