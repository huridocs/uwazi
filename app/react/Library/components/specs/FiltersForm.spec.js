import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as Immutable } from 'immutable';
import { Form } from 'react-redux-form';
import FormGroup from 'app/DocumentForm/components/FormGroup';


import { FiltersForm, mapStateToProps } from 'app/Library/components/FiltersForm';

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
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
            { label: 'c', value: 'c', values: [{ label: 'd', value: 'd' }] }
          ]
        },
        {
          _id: '6',
          name: 'multiselect',
          type: 'multiselect',
          content: 'thesauri1',
          options: [
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
            { label: 'c', value: 'c', values: [{ label: 'd', value: 'd' }] }
          ]
        }
      ]),
      documentTypes: Immutable({}),
      templates: Immutable([]),
      aggregations: Immutable({}),
      search: { searchTerm: 'Batman' },
      storeKey: 'library'
    };
    component = shallow(<FiltersForm {...props}/>);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm', () => {
      component.find(Form).simulate('submit', { myfilter: true });
      expect(props.searchDocuments).toHaveBeenCalledWith({ search: { myfilter: true } }, 'library');
    });
  });

  describe('render()', () => {
    it('should render diferent type fileds', () => {
      const fields = component.find(FormGroup);
      expect(fields.length).toBe(6);
    });
  });

  describe('maped state', () => {
    it('should contain the fields', () => {
      const store = {
        library: {
          ui: Immutable({ searchTerm: 'do a barrel roll' }),
          filters: Immutable({ properties: [{ name: 'author' }], documentTypes: { a: true } })
        },
        form: {
          filters: 'filtersForm'
        },
        templates: Immutable([]),
        settings: { collection: Immutable({}) }
      };
      const state = mapStateToProps(store, { storeKey: 'library' });
      expect(state.fields.toJS()).toEqual([{ name: 'author' }]);
      expect(state.documentTypes.toJS()).toEqual({ a: true });
    });
  });
});
