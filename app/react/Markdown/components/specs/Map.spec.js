import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Markers } from 'app/Map';

import { mapStateToProps, MapComponent } from '../Map.js';
import markdownDatasets from '../../markdownDatasets';


describe('Map Markdown component', () => {
  const state = {};

  it('should render the data passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getRows').and.returnValue(Immutable.fromJS(['passed entities']));

    const props = mapStateToProps(state, { prop1: 'propValue' });
    const component = shallow(<MapComponent {...props} classname="custom-class" />);
    const map = component.find(Markers).props().children([{ value: 'markers' }]);

    expect(markdownDatasets.getRows).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
    expect(map).toMatchSnapshot();
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

      const popUp1 = component.find(Markers).props().children([{ value: 'markers' }]).props.renderPopupInfo(marker1);
      expect(popUp1).toMatchSnapshot();
      const popUp2 = component.find(Markers).props().children([{ value: 'markers' }]).props.renderPopupInfo(marker2);
      expect(popUp2).toMatchSnapshot();
    });
  });
});
