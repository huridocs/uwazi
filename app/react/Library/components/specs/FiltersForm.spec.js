import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as Immutable } from 'immutable';
import { Form } from 'react-redux-form';

import { FiltersForm, mapStateToProps } from 'app/Library/components/FiltersForm';
import FiltersFromProperties from '../FiltersFromProperties';

describe('FiltersForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      searchDocuments: jasmine.createSpy('searchDocuments'),
      fields: Immutable([
        { _id: '1', name: 'name' },
        { _id: '2', name: 'name', type: 'numeric' },
        { _id: '3', name: 'date', type: 'date' },
        { _id: '4', name: 'nested', type: 'nested' },
        {
          _id: '5',
          name: 'select',
          type: 'select',
          content: 'thesauri1',
          options: [
            { id: 'a', label: 'a', value: 'a', results: 1 },
            { id: 'b', label: 'b', value: 'b', results: 1 },
            {
              id: 'c',
              label: 'c',
              value: 'c',
              results: 1,
              values: [{ id: 'd', label: 'd', value: 'd', results: 1 }],
            },
          ],
        },
        {
          _id: '6',
          name: 'multiselect',
          type: 'multiselect',
          content: 'thesauri1',
          options: [
            { id: 'a', label: 'a', value: 'a', results: 1 },
            { id: 'b', label: 'b', value: 'b', results: 1 },
            {
              id: 'c',
              label: 'c',
              value: 'c',
              values: [{ id: 'd', label: 'd', value: 'd', results: 1 }],
              results: 1,
            },
          ],
        },
      ]),
      documentTypes: Immutable([]),
      templates: Immutable([]),
      aggregations: Immutable({
        all: {
          select: {
            buckets: [
              { key: 'a', filtered: { doc_count: 1 } },
              { key: 'b', filtered: { doc_count: 1 } },
              { key: 'c', filtered: { doc_count: 1 } },
              { key: 'd', filtered: { doc_count: 1 } },
            ],
          },
          multiselect: {
            buckets: [
              { key: 'a', filtered: { doc_count: 1 } },
              { key: 'b', filtered: { doc_count: 1 } },
              { key: 'c', filtered: { doc_count: 1 } },
              { key: 'd', filtered: { doc_count: 1 } },
            ],
          },
        },
      }),
      search: { searchTerm: 'Batman' },
      storeKey: 'library',
    };
    component = shallow(<FiltersForm {...props} />);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm', () => {
      component.find(Form).simulate('submit', { myfilter: true });
      expect(props.searchDocuments).toHaveBeenCalledWith({ search: { myfilter: true } }, 'library');
    });
  });

  describe('render()', () => {
    it('should render diferent type fileds', () => {
      const fields = component.find(FiltersFromProperties);
      expect(fields).toMatchSnapshot();
    });
  });

  describe('maped state', () => {
    it('should contain the fields', () => {
      const store = {
        library: {
          ui: Immutable({ searchTerm: 'do a barrel roll' }),
          filters: Immutable({ properties: [{ name: 'author' }], documentTypes: { a: true } }),
        },
        form: {
          filters: 'filtersForm',
        },
        templates: Immutable([]),
        settings: { collection: Immutable({}) },
      };
      const state = mapStateToProps(store, { storeKey: 'library' });
      expect(state.fields.toJS()).toEqual([{ name: 'author' }]);
      expect(state.documentTypes.toJS()).toEqual({ a: true });
    });
  });
});
