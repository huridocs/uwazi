import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';
import {DragAndDropContainer} from 'app/Layout/DragAndDrop';

import {FiltersForm} from '../FiltersForm';

describe('FiltersForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      settings: {collection: fromJS({filters: [{_id: 1, name: 'Country'}, {_id: 2, name: 'Case'}]})},
      templates: fromJS([{_id: 3, name: 'Judge'}, {_id: 4, name: 'Court'}])
    };
  });

  let render = () => {
    component = shallow(<FiltersForm {...props} />);
  };

  it('should render a DragAndDropContainer with the active filters', () => {
    render();
    const container = component.find(DragAndDropContainer).first();
    expect(container.props().items).toEqual(component.state().activeFilters);
  });

  it('should render a DragAndDropContainer with the unactive filters', () => {
    render();
    const container = component.find(DragAndDropContainer).last();
    expect(container.props().items).toEqual(component.state().inactiveFilters);
  });
});
