import React from 'react';
import { shallow } from 'enzyme';
import { SimilarProperty } from 'app/Templates/components/FilterSuggestions';

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
