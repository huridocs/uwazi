import React from 'react';
import { shallow } from 'enzyme';
import Map from 'app/Map/Map';
import Immutable from 'immutable';
import { MapView } from '../MapView';

describe('MapView', () => {
  let component;
  let props;
  let instance;

  const documents = {
    rows: [
      { template: '1', metadata: { geo_prop: { lat: 1, lon: 2 }, age: '23' }, sharedId: '1' },
      { template: '1', metadata: { age: '23' }, sharedId: '2' },
      { template: '2', metadata: { other_geo_prop: { lat: 3, lon: 4 }, age: '23' }, sharedId: '3' },
      { template: '2', metadata: { other_geo_prop: { lat: 1, lon: 2 }, age: '23' }, sharedId: '4' },
      { template: '3', metadata: { age: '23' }, sharedId: '4' }
    ]
  };
  const templates = [
    { _id: '1', properties: [{ name: 'geo_prop', type: 'geolocation' }, { name: 'age', type: 'text' }] },
    { _id: '2', properties: [{ name: 'other_geo_prop', type: 'geolocation' }, { name: 'age', type: 'text' }] },
    { _id: '3', properties: [{ name: 'age', type: 'text' }] }
  ];

  const render = () => {
    props = {
      entities: Immutable.fromJS(documents),
      templates: Immutable.fromJS(templates),
      selectDocument: jasmine.createSpy('selectDocument'),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments')
    };
    component = shallow(<MapView {...props} />);
    instance = component.instance();
  };

  beforeEach(render);

  describe('render()', () => {
    it('should render a map', () => {
      expect(component.find(Map).length).toBe(1);
    });

    it('should pass the markers', () => {
      const expectedMarkers = [
        { latitude: 1, longitude: 2, entity: Immutable.fromJS(documents.rows[0]) },
        { latitude: 3, longitude: 4, entity: Immutable.fromJS(documents.rows[2]) },
        { latitude: 1, longitude: 2, entity: Immutable.fromJS(documents.rows[3]) }
      ];
      expect(component.find(Map).props().markers).toEqual(expectedMarkers);
    });
  });

  describe('clickOnMarker()', () => {
    it('should unselect all documents and select the one in i¡the marker', () => {
      const marker = { latitude: 1, longitude: 2, entity: Immutable.fromJS(documents.rows[2]) };
      instance.clickOnMarker(marker);
      expect(props.unselectAllDocuments).toHaveBeenCalled();
      expect(props.selectDocument).toHaveBeenCalledWith(marker.entity);
    });
  });
});
