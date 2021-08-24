import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Markers } from 'app/Map';

import * as actions from 'app/Library/actions/libraryActions';
import { mapStateToProps, mapDispatchToProps, MapComponent } from '../Map.js';
import markdownDatasets from '../../markdownDatasets';

describe('Map Markdown component', () => {
  const state = {};

  function getProps(originalState, originalProps, dispatch) {
    const _dispatch = dispatch || jest.fn('dispatch');
    return {
      ...mapStateToProps(originalState, originalProps),
      ...mapDispatchToProps(_dispatch),
    };
  }

  function spyOnDatasetRows() {
    spyOn(markdownDatasets, 'getRows').and.returnValue(
      Immutable.fromJS([
        { template: 't1', metadata: { geoProperty: [{ value: { lat: 7, lon: 13 } }] } },
        { template: 't2', metadata: { anotherGeoProperty: [{ value: { lat: 2018, lon: 6 } }] } },
      ])
    );
  }

  function findInnerMapComponent(component) {
    return component
      .find(Markers)
      .props()
      .children([{ value: 'markers' }]);
  }

  it('should render the data passed by mapStateToProps', () => {
    spyOn(markdownDatasets, 'getRows').and.returnValue(Immutable.fromJS(['passed entities']));

    const props = getProps(state, { prop1: 'propValue' });
    const component = shallow(<MapComponent {...props} classname="custom-class" />);
    const map = findInnerMapComponent(component);

    expect(markdownDatasets.getRows).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
    expect(map).toMatchSnapshot();
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(markdownDatasets, 'getRows').and.returnValue(undefinedValue);
    const props = getProps(state, { prop2: 'propValue' });
    const component = shallow(<MapComponent {...props} />);

    expect(markdownDatasets.getRows).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('renderPopupInfo', () => {
    it('should have a correct function for rendering popus', () => {
      spyOnDatasetRows();

      const props = getProps(state, { prop2: 'propValue' });
      const component = shallow(<MapComponent {...props} />);
      const marker1 = { properties: { entity: { template: 't1', title: 'title' } } };
      const marker2 = { properties: { entity: { template: 't2', title: 'another title' } } };

      const popUp1 = findInnerMapComponent(component).props.renderPopupInfo(marker1);
      expect(popUp1).toMatchSnapshot();
      const popUp2 = findInnerMapComponent(component).props.renderPopupInfo(marker2);
      expect(popUp2).toMatchSnapshot();
    });
  });

  describe('clickOnMarker', () => {
    it('should fetch and display document when marker is clicked', () => {
      spyOnDatasetRows();

      const getAndSelectDocument = jest.spyOn(actions, 'getAndSelectDocument');
      const dispatch = jest.fn();
      const props = getProps(state, { prop2: 'propValue' }, dispatch);
      const component = shallow(<MapComponent {...props} />);
      const marker = { properties: { entity: { template: 't1', title: 'title', sharedId: 'id' } } };
      findInnerMapComponent(component).props.clickOnMarker(marker);
      expect(getAndSelectDocument).toHaveBeenCalledWith('id');
    });
  });

  describe('clickOnCluster', () => {
    it('should set documents in cluster as selected documents', () => {
      spyOnDatasetRows();

      const unselectAllDocuments = jest.spyOn(actions, 'unselectAllDocuments');
      const selectDocuments = jest.spyOn(actions, 'selectDocuments');
      const dispatch = jest.fn();
      const props = getProps(state, { prop2: 'propValue' }, dispatch);
      const component = shallow(<MapComponent {...props} />);
      const cluster = [
        { properties: { entity: { template: 't1', title: 'title', sharedId: 'id' } } },
        { properties: { entity: { template: 't1', title: 'title', sharedId: 'id2' } } },
      ];
      findInnerMapComponent(component).props.clickOnCluster(cluster);
      expect(unselectAllDocuments).toHaveBeenCalled();
      expect(selectDocuments).toHaveBeenCalledWith([
        { template: 't1', title: 'title', sharedId: 'id' },
        { template: 't1', title: 'title', sharedId: 'id2' },
      ]);
    });
  });
});
