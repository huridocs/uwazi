import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { mapStateToProps, MapComponent } from '../Map.js';
import markdownDatasets from '../../markdownDatasets';

import Map from 'app/Map/Map';

describe('Map Markdown component', () => {
  const state = {
    templates: Immutable.fromJS([{
      _id: 't1',
      properties: [
        { type: 'geolocation', name: 'geoProperty' },
      ]
    }, {
      _id: 't2',
      properties: [
        { type: 'geolocation', name: 'anotherGeoProperty' },
      ]
    }, {
      _id: 't3',
      properties: [
        { type: 'notGeolocation', name: 'notGeo' },
      ]
    }]),
  };

  it('should render the data passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getRows').and.returnValue(Immutable.fromJS([
      { template: 't1', metadata: { geoProperty: { lat: 7, lon: 13 } } },
      { template: 't1', metadata: { geoProperty: { lat: 5, lon: 22 } } },
      { template: 't3', metadata: { notGeo: { lat: 1977, lon: 7 } } },
      { template: 't2', metadata: { anotherGeoProperty: { lat: 2018, lon: 6 } } },
    ]));

    const props = mapStateToProps(state, { prop1: 'propValue' });
    const component = shallow(<MapComponent {...props} classname="custom-class" />);

    expect(markdownDatasets.getRows).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render empty map on no rows', () => {
    spyOn(markdownDatasets, 'getRows').and.returnValue(Immutable.fromJS([]));

    const props = mapStateToProps(state, {});
    const component = shallow(<MapComponent {...props} classname="custom-class" />);

    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getRows').and.returnValue(undefinedValue);
    const props = mapStateToProps(state, { prop2: 'propValue' });
    const component = shallow(<MapComponent {...props} />);

    expect(markdownDatasets.getRows).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('renderPopupInfo', () => {
    it('should have a correct function for rendering popus', () => {
      spyOn(markdownDatasets, 'getRows').and.returnValue(Immutable.fromJS([
        { template: 't1', metadata: { geoProperty: { lat: 7, lon: 13 } } },
        { template: 't2', metadata: { anotherGeoProperty: { lat: 2018, lon: 6 } } },
      ]));

      const props = mapStateToProps(state, { prop2: 'propValue' });
      const component = shallow(<MapComponent {...props} />);
      const marker1 = { properties: { entity: { template: 't1', title: 'title' } } };
      const marker2 = { properties: { entity: { template: 't2', title: 'another title' } } };

      const popUp1 = shallow(component.find(Map).props().renderPopupInfo(marker1));
      expect(popUp1).toMatchSnapshot();
      const popUp2 = shallow(component.find(Map).props().renderPopupInfo(marker2));
      expect(popUp2).toMatchSnapshot();
    });
  });
});
