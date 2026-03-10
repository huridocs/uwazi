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
      location: { myfilter: 'true' },
      navigate: jest.fn(),
      searchDocuments: jasmine.createSpy('searchDocuments'),
      fields: Immutable([
        { _id: '1', name: 'name' },
        { _id: '2', name: 'name', type: 'numeric' },
        { _id: '3', name: 'date', type: 'date', defaultfilter: true },
        { _id: '4', name: 'nested', type: 'nested' },
        {
          _id: '5',
          name: 'select',
          type: 'select',
          content: 'thesauri1',
          defaultfilter: true,
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
            count: 10,
            buckets: [
              { key: 'a', label: 'a', filtered: { doc_count: 1 } },
              { key: 'b', label: 'b', filtered: { doc_count: 1 } },
              {
                key: 'c',
                label: 'c',
                filtered: { doc_count: 1 },
                values: [{ key: 'd', label: 'd', filtered: { doc_count: 1 } }],
              },
              { key: 'missing', label: 'No Label', filtered: { doc_count: 6 } },
            ],
          },
          multiselect: {
            count: 3,
            buckets: [
              { key: 'a', label: 'a', filtered: { doc_count: 1 } },
              { key: 'b', label: 'b', filtered: { doc_count: 1 } },
              {
                key: 'c',
                label: 'c',
                filtered: { doc_count: 1 },
                values: [{ key: 'd', label: 'd', filtered: { doc_count: 1 } }],
              },
            ],
          },
        },
      }),
      search: { searchTerm: 'Batman' },
      storeKey: 'library',
    };
  });

  const render = () => {
    component = shallow(<FiltersForm {...props} />);
  };

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm', () => {
      render();
      component.find(Form).simulate('submit', { myfilter: true });
      expect(props.searchDocuments).toHaveBeenCalledWith({
        location: props.location,
        navigate: props.navigate,
      });
    });
  });

  describe('render()', () => {
    it('should render diferent type fileds', () => {
      render();
      const fields = component.find(FiltersFromProperties);
      expect(fields).toMatchSnapshot();
    });

    it('should omit No Label aggregation when filter is default and no templates are selected', () => {
      render();
      const fields = component.find(FiltersFromProperties);
      expect(fields.props().properties[4].options).not.toContainEqual({
        id: 'missing',
        value: 'missing',
        label: 'No Label',
        results: 6,
        noValueKey: true,
      });
    });

    it('should show the No Label aggregation for default filters when a template is selected', () => {
      props.documentTypes = Immutable(['templateId']);
      render();
      const fields = component.find(FiltersFromProperties);
      expect(fields.props().properties[4].options).toContainEqual({
        id: 'missing',
        label: 'No Label',
        noValueKey: true,
        results: 6,
        value: 'missing',
      });
    });
  });

  describe('mapped state', () => {
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
