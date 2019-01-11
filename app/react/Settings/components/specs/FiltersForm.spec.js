import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';
import { DragAndDropContainer } from 'app/Layout/DragAndDrop';
import SettingsAPI from 'app/Settings/SettingsAPI';

import { FiltersForm } from '../FiltersForm';

describe('FiltersForm', () => {
  let component;
  let props;
  let filters;
  let instance;

  beforeEach(() => {
    filters = [
      { id: 1, name: 'Country', container: '' },
      { id: 2, name: 'Case', container: '' },
      { id: 'asd',
        name: 'Institutions',
        container: '',
        items: [{ id: 4, name: 'Court' }]
      }
    ];

    props = {
      settings: { collection: fromJS({ filters }) },
      templates: fromJS([{ _id: 1, name: 'Country' }, { _id: 2, name: 'Case' }, { _id: 3, name: 'Judge' }, { _id: 4, name: 'Court' }])
    };
  });

  const render = () => {
    component = shallow(<FiltersForm {...props} />);
    instance = component.instance();
  };

  it('should set the state with the active filters', () => {
    render();
    expect(component.state().activeFilters).toEqual(filters);
  });

  it('should set the state with the active inactiveFilters', () => {
    render();
    expect(component.state().inactiveFilters).toEqual([{ id: 3, name: 'Judge' }]);
  });

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

  describe('save', () => {
    it('should sanitize and call teh api', () => {
      spyOn(SettingsAPI, 'save').and.returnValue(Promise.resolve());
      instance.save();
      const expectedFilters = { filters: [
        { id: 1, name: 'Country' },
        { id: 2, name: 'Case' },
        { id: 'asd', items: [{ id: 4, name: 'Court' }], name: 'Institutions' }]
      };
      expect(SettingsAPI.save).toHaveBeenCalledWith(expectedFilters);
    });
  });
});
