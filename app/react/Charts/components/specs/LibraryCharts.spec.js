import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';
import {store} from 'app/store';
import t from 'app/I18N/t';

import {LibraryCharts, mapStateToProps} from '../LibraryCharts';
import LibraryChart from '../LibraryChart';

describe('LibraryCharts', () => {
  let component;
  let props;
  let state;

  let render = () => {
    component = shallow(<LibraryCharts {...props} />);
  };

  beforeEach(() => {
    t.resetCachedTranslation();
    state = {
      locale: 'es',
      translations: fromJS([
        {locale: 'es', contexts: [
          {id: 'tcontext', values: {
            'Document and entity types': 'Document and entity types translated'
          }},
          {id: 't2', values: {
            t2name: 't2nameTranslated'
          }},
          {id: 'cid', values: {
            n: 'nTranslated'
          }}
        ]}
      ])
    };

    spyOn(store, 'getState').and.returnValue(state);
  });

  describe('When no fields found', () => {
    beforeEach(() => {
      props = {
        aggregations: fromJS({
          all: {types: {buckets: [
            {key: 't1', filtered: {doc_count: 5}}, // eslint-disable-line camelcase
            {key: 't2', filtered: {doc_count: 1}}, // eslint-disable-line camelcase
            {key: 't3', filtered: {doc_count: 10}}, // eslint-disable-line camelcase
            {key: 'missing', filtered: {doc_count: 13}} // eslint-disable-line camelcase
          ]}}
        }),
        fields: fromJS([]),
        collection: fromJS({filters: []}),
        templates: fromJS([
          {_id: 't1', name: 't1name'},
          {_id: 't2', name: 't2name'},
          {_id: 't3', name: 't3name'}
        ]),
        translationContext: 'tcontext'
      };
    });

    it('should render templates types on LibraryChart', () => {
      render();
      expect(component.find(LibraryChart).length).toBe(1);
      const LibraryChartElement = component.find(LibraryChart);

      expect(LibraryChartElement.props().label).toBe('Document and entity types translated');
      expect(LibraryChartElement.props().options[0]).toEqual({label: 't1name', results: 5});
      expect(LibraryChartElement.props().options[1]).toEqual({label: 't2nameTranslated', results: 1});
      expect(LibraryChartElement.props().options[2]).toEqual({label: 't3name', results: 10});
    });

    it('should also include no-type when on uploads', () => {
      props.storeKey = 'uploads';
      render();
      expect(component.find(LibraryChart).length).toBe(1);
      const LibraryChartElement = component.find(LibraryChart);

      expect(LibraryChartElement.props().options[0]).toEqual({label: 'No type', results: 13});
      expect(LibraryChartElement.props().options[1]).toEqual({label: 't1name', results: 5});
      expect(LibraryChartElement.props().options[2]).toEqual({label: 't2nameTranslated', results: 1});
      expect(LibraryChartElement.props().options[3]).toEqual({label: 't3name', results: 10});
    });

    it('should add the results of sub-items in filters', () => {
      props.collection = fromJS({filters: [
        {id: 'g1', name: 'group1', items: [{id: 't1', filtered: {doc_count: 5}}, {id: 't2', filtered: {doc_count: 1}}]}, // eslint-disable-line camelcase, max-len
        {id: 't3', name: 't3name', filtered: {doc_count: 10}} // eslint-disable-line camelcase
      ]});
      render();
      expect(component.find(LibraryChart).length).toBe(1);
      const LibraryChartElement = component.find(LibraryChart);

      expect(LibraryChartElement.props().options[0]).toEqual({label: 'group1', results: 6});
      expect(LibraryChartElement.props().options[1]).toEqual({label: 't3name', results: 10});
    });
  });

  describe('When no valid fields found', () => {
    beforeEach(() => {
      props = {
        aggregations: fromJS({
          all: {types: {buckets: [
            {key: 't1', filtered: {doc_count: 5}}, // eslint-disable-line camelcase
            {key: 't2', filtered: {doc_count: 1}}, // eslint-disable-line camelcase
            {key: 't3', filtered: {doc_count: 10}}, // eslint-disable-line camelcase
            {key: 'missing', filtered: {doc_count: 13}} // eslint-disable-line camelcase
          ]}}
        }),
        fields: fromJS([{type: 'not-valid'}]),
        collection: fromJS({filters: []}),
        templates: fromJS([
          {_id: 't1', name: 't1name'},
          {_id: 't2', name: 't2name'},
          {_id: 't3', name: 't3name'}
        ])
      };
    });

    it('should render templates types on LibraryChart', () => {
      render();
      expect(component.find(LibraryChart).length).toBe(1);
      const LibraryChartElement = component.find(LibraryChart);

      expect(LibraryChartElement.props().options[0]).toEqual({label: 't1name', results: 5});
      expect(LibraryChartElement.props().options[1]).toEqual({label: 't2nameTranslated', results: 1});
      expect(LibraryChartElement.props().options[2]).toEqual({label: 't3name', results: 10});
    });
  });

  describe('When fields found', () => {
    beforeEach(() => {
      props = {
        aggregations: fromJS({
          all: {
            types: {buckets: [
              {key: 'f1', filtered: {doc_count: 5}},  // eslint-disable-line camelcase
              {key: 'f2', filtered: {doc_count: 1}},  // eslint-disable-line camelcase
              {key: 'f3', filtered: {doc_count: 10}}  // eslint-disable-line camelcase
            ]},
            pname: {buckets: [
              {key: 'o1', filtered: {doc_count: 10}}, // eslint-disable-line camelcase
              {key: 'o2', filtered: {doc_count: 8}},  // eslint-disable-line camelcase
              {key: 'o3', filtered: {doc_count: 8}},  // eslint-disable-line camelcase
              {key: 'o4', filtered: {doc_count: 8}},  // eslint-disable-line camelcase
              {key: 'o5', filtered: {doc_count: 2}}   // eslint-disable-line camelcase
            ]}
          }
        }),
        fields: fromJS([
          {type: 'select', content: 'cid', name: 'pname', options: [
            {id: 'o1', label: 'a', results: 10},
            {id: 'o2', label: 'z', results: 8},
            {id: 'o3', label: 'a', results: 8},
            {id: 'o4', label: 'n', results: 8},
            {id: 'o5', label: 'a', results: 2}
          ]},
          {type: 'not-valid'},
          {type: 'multiselect', options: [
            {label: 'Z', results: 10},
            {label: 'A', results: 8},
            {label: 'Z', results: 8},
            {label: 'g', results: 8},
            {label: 'a', results: 2}
          ]},
          {type: 'multiselect', options: []}
        ]),
        collection: fromJS({filters: []})
      };
    });

    it('should render one LibraryChart for each supported field with sorted options', () => {
      render();
      expect(component.find(LibraryChart).length).toBe(2);

      const LibraryChartElement1 = component.find(LibraryChart).at(0);

      expect(LibraryChartElement1.props().options[0]).toEqual({id: 'o1', label: 'a', results: 10});
      expect(LibraryChartElement1.props().options[1]).toEqual({id: 'o3', label: 'a', results: 8});
      expect(LibraryChartElement1.props().options[2]).toEqual({id: 'o4', label: 'nTranslated', results: 8});
      expect(LibraryChartElement1.props().options[3]).toEqual({id: 'o2', label: 'z', results: 8});
      expect(LibraryChartElement1.props().options[4]).toEqual({id: 'o5', label: 'a', results: 2});

      const LibraryChartElement2 = component.find(LibraryChart).at(1);

      expect(LibraryChartElement2.props().options[0]).toEqual({label: 'Z', results: 10});
      expect(LibraryChartElement2.props().options[1]).toEqual({label: 'A', results: 8});
      expect(LibraryChartElement2.props().options[2]).toEqual({label: 'g', results: 8});
      expect(LibraryChartElement2.props().options[3]).toEqual({label: 'Z', results: 8});
      expect(LibraryChartElement2.props().options[4]).toEqual({label: 'a', results: 2});
    });
  });

  describe('mapStateToProps', () => {
    beforeEach(() => {
      state = {
        a: {aggregations: 'a', filters: fromJS({properties: 'a', documentTypes: ['dt1']})},
        b: {aggregations: 'b', filters: fromJS({properties: 'b', documentTypes: ['dt2']})},
        settings: {collection: 'collection'},
        templates: 'templates'
      };
    });

    it('should return aggregations, fields and translation context according to store key', () => {
      expect(mapStateToProps(state, {storeKey: 'a'}).aggregations).toBe('a');
      expect(mapStateToProps(state, {storeKey: 'b'}).aggregations).toBe('b');
      expect(mapStateToProps(state, {}).aggregations).toBe(null);

      expect(mapStateToProps(state, {storeKey: 'a'}).fields).toBe('a');
      expect(mapStateToProps(state, {storeKey: 'b'}).fields).toBe('b');
      expect(mapStateToProps(state, {}).fields).toBe(null);

      expect(mapStateToProps(state, {storeKey: 'a'}).translationContext).toBe('dt1');
      expect(mapStateToProps(state, {storeKey: 'b'}).translationContext).toBe('dt2');
      expect(mapStateToProps(state, {}).translationContext).toBe(null);
    });

    it('should return collection and templates', () => {
      expect(mapStateToProps(state, {}).collection).toBe('collection');
      expect(mapStateToProps(state, {}).templates).toBe('templates');
    });
  });
});
