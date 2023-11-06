import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

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
    const component = shallow(<MatomoComponent {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should add "/" at the end of url when not set', () => {
    props.url = 'url';
    const component = shallow(<MatomoComponent {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should not include script when id or url are not set', () => {
    props = {};
    const component = shallow(<MatomoComponent {...props} />);
    expect(component).toMatchSnapshot();
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
