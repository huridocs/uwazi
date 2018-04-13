import React from 'react';
import { shallow } from 'enzyme';
import ReactMapGL, { NavigationControl, Marker, Popup } from 'react-map-gl';

import Map from '../Map';

describe('Map', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {
      onClick: jasmine.createSpy('onClick'),
      latitude: 103,
      longitude: -63,
      zoom: 8,
      markers: [{ latitude: 2, longitude: 32 }, { latitude: 23, longitude: 21 }]

    };
    component = shallow(<Map {...props} />);
    component.instance.container = {};
  });

  describe('render', () => {
    it('should render a ReactMapGL with the props', () => {
      const reactMap = component.find(ReactMapGL);
      expect(reactMap.props().latitude).toBe(103);
      expect(reactMap.props().longitude).toBe(-63);
    });
  });
});
