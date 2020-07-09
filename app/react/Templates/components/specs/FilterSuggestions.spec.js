import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { SimilarProperty } from 'app/Templates/components/FilterSuggestions';
import { FilterSuggestions } from '../FilterSuggestions';

describe('SimilarProperty', () => {
  let component;
  function render(props) {
    component = shallow(<SimilarProperty {...props} />);
  }
  it('should not alert about a conflict if there are no conflicts', () => {
    const props = {
      templateProperty: {
        template: 'template 1',
        type: 'relationship',
        relationTypeName: 'related',
        thesaurusName: 'entity 1',
        typeConflict: false,
        relationConflict: false,
        contentConflict: false,
      },
    };
    render(props);
    const typeCell = component.find('.conflict');
    expect(typeCell.length).toBe(0);
    const cells = component.find('td');
    expect(cells.get(0).props.children[2]).toBe('template 1');
    expect(cells.get(1).props.children[2]).toBe(' relationship');
    expect(cells.get(2).props.children[2]).toBe('entity 1');
    const warningIcon = component.find({ icon: 'exclamation-triangle' });
    expect(warningIcon.length).toBe(0);
  });

  it('should alert about a conflict  with type', () => {
    const props = {
      templateProperty: {
        template: 'template 1',
        type: 'text',
        typeConflict: true,
        relationConflict: false,
        contentConflict: false,
      },
    };
    render(props);
    const typeCell = component.find('.conflict');
    expect(typeCell.props().title).not.toBeUndefined();
    expect(typeCell.get(0).props.children[2]).toBe(' text');
    const warningIcon = typeCell.find({ icon: 'exclamation-triangle' });
    expect(warningIcon.get(0)).not.toBeUndefined();
  });

  it('should alert about a conflict  with relationType', () => {
    const props = {
      templateProperty: {
        template: 'template 1',
        type: 'text',
        relationTypeName: 'related',
        typeConflict: false,
        relationConflict: true,
        contentConflict: false,
      },
    };
    render(props);
    const typeCell = component.find('.conflict');
    expect(typeCell.props().title).not.toBeUndefined();
    expect(typeCell.get(0).props.children[2]).toBe(' text');
    expect(typeCell.get(0).props.children[3]).toBe(' (related)');
    const warningIcon = typeCell.find({ icon: 'exclamation-triangle' });
    expect(warningIcon.get(0)).not.toBeUndefined();
  });

  it('should alert about a conflict with content of property', () => {
    const props = {
      templateProperty: {
        template: 'template 1',
        type: 'select',
        thesaurusName: 'thesaurus 1',
        typeConflict: false,
        relationConflict: false,
        contentConflict: true,
      },
    };
    render(props);
    const typeCell = component.find('.conflict');
    expect(typeCell.props().title).not.toBeUndefined();
    expect(typeCell.get(0).props.children[2]).toBe('thesaurus 1');
    const warningIcon = typeCell.find({ icon: 'exclamation-triangle' });
    expect(warningIcon.get(0)).not.toBeUndefined();
  });
});
describe('FilterSuggestions', () => {
  let component;
  let props;
  let templates;
  let thesauris;

  function renderComponent(label = 'test', type = 'text', content) {
    templates = [
      {
        _id: 'template1',
        properties: [
          { localID: 1, label, filter: true, type },
          { localID: 2, label: 'something else' },
          { label: 'Date', type: 'date', filter: true },
        ],
      },
      {
        _id: 'template2',
        name: 'Template 2',
        properties: [
          { label: 'Date', type: 'date', filter: true },
          { label: 'Author', type: 'text', filter: true },
          { label: 'filterFalse', type: 'text', filter: false },
          { label: 'Authors', type: 'select', filter: true, content: 'abc1' },
        ],
      },
      {
        _id: 'template3',
        name: 'Template 3',
        properties: [
          { label: 'date ', type: 'date', filter: true },
          { label: 'filterFalse', type: 'text', filter: true },
          { label: 'Keywords', type: 'text', filter: true },
        ],
      },
    ];

    thesauris = [
      { _id: 'abc1', name: 'Best SCI FI Authors' },
      { _id: 'abc2', name: 'Favourite dessert recipes' },
    ];

    props = {
      label,
      type,
      filter: true,
      content,
      templateName: 'Current template',
      templateId: 'template1',
      templates: Immutable.fromJS(templates),
      thesauris: Immutable.fromJS(thesauris),
    };

    component = shallow(<FilterSuggestions {...props} />);
  }

  it('should always render the current property as a guide', () => {
    renderComponent('Year', 'date');
    const suggestion = component.find({
      templateProperty: { template: 'Current template (this template)' },
    });
    expect(suggestion.props().templateProperty.type).toBe('Date');
  });

  it('should render all the matched properties in other templates', () => {
    renderComponent('Date', 'text');
    const suggestion = component.find(SimilarProperty);
    expect(suggestion.length).toBe(3);
    expect(suggestion.get(0).props.templateProperty.template).toBe(
      'Current template (this template)'
    );
    expect(suggestion.get(1).props.templateProperty.template).toBe('Template 2');
    expect(suggestion.get(2).props.templateProperty.template).toBe('Template 3');
  });

  describe('when matches type+ and label as other template property', () => {
    it('should show a message', () => {
      renderComponent('author', 'text');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.typeConflict).toBe(false);
    });
  });

  describe('when label is the same but different type', () => {
    it('should mark it as conflict', () => {
      renderComponent('author', 'date');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.typeConflict).toBe(true);
    });
  });

  describe('when label is the same but different content', () => {
    it('should mark it as conflict', () => {
      renderComponent('authors', 'select', 'abc2');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.contentConflict).toBe(true);
    });
  });
});
