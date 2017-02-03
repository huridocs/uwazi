import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FilterSuggestions} from '../FilterSuggestions';

describe('FilterSuggestions', () => {
  let component;
  let props;
  let templates;
  let thesauris;

  function renderComponent(label = 'test', type = 'text', content) {
    templates = [
      {_id: 'template1', properties: [
        {localID: 1, label: label, filter: true, type},
        {localID: 2, label: 'something else'}
      ]},
      {_id: 'template2', name: 'Template 2', properties: [
        {label: 'Date', type: 'date', filter: true},
        {label: 'Author', type: 'text', filter: true},
        {label: 'Authors', type: 'select', filter: true, content: 'abc1'}
      ]},
      {_id: 'template3', name: 'Template 3', properties: [
        {label: 'Date', type: 'date', filter: true},
        {label: 'Keywords', type: 'text', filter: true}
      ]}
    ];

    thesauris = [
      {_id: 'abc1', name: 'Best SCI FI Authors'},
      {_id: 'abc2', name: 'Favourite dessert recipes'}
    ];

    props = {
      label,
      type,
      filter: true,
      content,
      data: {name: 'Current template', _id: 'template1'},
      templates: Immutable.fromJS(templates),
      thesauris: Immutable.fromJS(thesauris)
    };

    component = shallow(<FilterSuggestions {...props}/>);
  }

  it('should always render the current property as a guide', () => {
    renderComponent('Year', 'date');
    const suggestion = component.find('tbody > tr').at(0);
    expect(suggestion.text().trim())
    .toBe('Current template Date');
  });

  describe('when matches type and label as other template property', () => {
    it('should show a message', () => {
      renderComponent('author', 'text');
      let suggestion = component.find('tbody > tr').at(1);
      expect(suggestion.text().trim())
      .toBe('Template 2 Text');
    });
  });

  describe('when label is the same but different type', () => {
    it('should mark it as conflict', () => {
      renderComponent('author', 'date');
      let suggestion = component.find('.conflict');
      expect(suggestion.text().trim())
      .toBe('Text');
    });
  });

  describe('when label is the same but different content', () => {
    it('should mark it as conflict', () => {
      renderComponent('authors', 'select', 'abc2');
      let suggestion = component.find('.conflict');
      expect(suggestion.text().trim())
      .toBe('Best SCI FI Authors');
    });
  });
});
