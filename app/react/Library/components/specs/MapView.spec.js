import React from 'react';
import { shallow } from 'enzyme';
import { Markers } from 'app/Map';
import Immutable from 'immutable';
import { MapViewComponent } from 'app/Library/components/MapView';

describe('MapView', () => {
  let component;
  let props;
  let instance;

  const documents = {
    rows: [
      {
        template: '1',
        metadata: { geo_prop: [{ value: { lat: 1, lon: 2 } }], age: [{ value: '23' }] },
        sharedId: '1',
      },
      { template: '1', metadata: { age: [{ value: '23' }] }, sharedId: '2' },
      {
        template: '2',
        metadata: { other_geo_prop: [{ value: { lat: 3, lon: 4 } }], age: [{ value: '23' }] },
        sharedId: '3',
      },
      {
        template: '2',
        metadata: { other_geo_prop: [{ value: { lat: 1, lon: 2 } }], age: [{ value: '23' }] },
        sharedId: '4',
      },
      { template: '3', metadata: { age: [{ value: '23' }] }, sharedId: '4' },
    ],
  };
  const templates = [
    {
      _id: '1',
      properties: [
        { name: 'geo_prop', type: 'geolocation' },
        { name: 'age', type: 'text' },
      ],
    },
    {
      _id: '2',
      properties: [
        { name: 'other_geo_prop', type: 'geolocation' },
        { name: 'age', type: 'text' },
      ],
    },
    { _id: '3', properties: [{ name: 'age', type: 'text' }] },
  ];

  const render = () => {
    props = {
      markers: Immutable.fromJS(documents),
      storeKey: 'library',
      templates: Immutable.fromJS(templates),
      getAndSelectDocument: jasmine.createSpy('getAndSelectDocument'),
      selectDocuments: jasmine.createSpy('selectDocuments'),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
    };
    component = shallow(<MapViewComponent {...props} />);
    instance = component.instance();
  };

  beforeEach(render);

  describe('render()', () => {
    it('should render a map', () => {
      const map = component
        .find(Markers)
        .props()
        .children([{ value: 'markers' }]);
      expect(map).toMatchSnapshot();
    });

    it('should pass the entities', () => {
      expect(component.find(Markers).props().entities).toMatchSnapshot();
    });
  });

  describe('clickOnMarker()', () => {
    it('should unselect all documents and select the one in the marker', () => {
      const marker = { latitude: 1, longitude: 2, properties: { entity: documents.rows[2] } };
      instance.clickOnMarker(marker);
      expect(props.getAndSelectDocument).toHaveBeenCalledWith(documents.rows[2].sharedId);
    });
  });

  describe('clickOnCluster()', () => {
    it('should unselect all documents and select the documents in the cluster', () => {
      const cluster = [
        { latitude: 1, longitude: 2, properties: { entity: documents.rows[2] } },
        { latitude: 1, longitude: 2, properties: { entity: documents.rows[3] } },
      ];
      instance.clickOnCluster(cluster);
      expect(props.unselectAllDocuments).toHaveBeenCalled();
      expect(props.selectDocuments).toHaveBeenCalledWith([documents.rows[2], documents.rows[3]]);
    });
  });
});
