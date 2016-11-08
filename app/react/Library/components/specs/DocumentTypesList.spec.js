import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {DocumentTypesList} from '../DocumentTypesList';

describe('DocumentTypesList', () => {
  let component;
  let props;
  let filters;
  let aggregations;

  beforeEach(() => {
    filters = [
      {id: 1, name: 'Judge'},
      {id: 2, name: 'Country'},
      {id: 3, name: 'Documents', items: [
        {id: 4, name: 'Decision'},
        {id: 5, name: 'Cause'}
      ]}
    ];

    aggregations = {
      types: {
        buckets: [
          {doc_count: 23, key: 1, filtered: {doc_count: 7}},
          {doc_count: 43, key: 2, filtered: {doc_count: 2}},
          {doc_count: 31, key: 4, filtered: {doc_count: 4}},
          {doc_count: 68, key: 5, filtered: {doc_count: 9}}
        ]
      }
    };

    props = {
      onChange: jasmine.createSpy('onChange'),
      settings: {collection: Immutable.fromJS({filters})},
      aggregations: Immutable.fromJS(aggregations)
    };
  });

  let render = () => {
    component = shallow(<DocumentTypesList {...props}/>);
  };

  describe('render', () => {
    it('should render a li element for each option', () => {
      render();
      let liElements = component.find('li');
      expect(liElements.length).toBe(5);
    });

    it('should render a sublist for types groups', () => {
      render();
      let liElements = component.find('li').at(2).find('ul').find('li');
      expect(liElements.length).toBe(2);
    });
  });

  describe('clicking on a type', () => {
    it('should check it', () => {
      render();
      let liElements = component.find('li');
      liElements.at(0).find('input').simulate('change');
      expect(component.state().selectedItems).toEqual([1]);
      expect(props.onChange).toHaveBeenCalledWith([1]);

      liElements.at(1).find('input').simulate('change');
      expect(component.state().selectedItems).toEqual([1, 2]);
      expect(props.onChange).toHaveBeenCalledWith([1, 2]);
    });

    describe('when is a group', () => {
      it('should select all the items', () => {
        render();
        let liElements = component.find('li');
        liElements.at(2).find('input').first().simulate('change', {target: {checked: true}});
        expect(component.state().selectedItems).toEqual([4, 5]);
        expect(props.onChange).toHaveBeenCalledWith([4, 5]);

        liElements.at(2).find('input').first().simulate('change', {target: {checked: false}});
        expect(component.state().selectedItems).toEqual([]);
        expect(props.onChange).toHaveBeenCalledWith([]);
      });
    });
  });
});
