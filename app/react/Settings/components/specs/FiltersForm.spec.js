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
      { id: 1, name: 'Country', container: '', index: 0 },
      { id: 2, name: 'Case', container: '', index: 1 },
      {
        id: 'asd',
        name: 'Institutions',
        container: '',
        index: 2,
        items: [{ id: 4, name: 'Court' }],
      },
    ];

    props = {
      notify: () => {},
      setSettings: () => {},
      settings: { collection: fromJS({ filters }) },
      templates: fromJS([
        { _id: 1, name: 'Country' },
        { _id: 2, name: 'Case' },
        { _id: 3, name: 'Judge' },
        { _id: 4, name: 'Court' },
      ]),
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

  it('should set the state with the inactiveFilters', () => {
    render();
    expect(component.state().inactiveFilters).toEqual([{ id: 3, name: 'Judge' }]);
  });

  it('should render a DragAndDropContainer with the active filters', () => {
    render();
    const container = component.find(DragAndDropContainer).first();
    expect(container.props().items).toEqual(component.state().activeFilters);
  });

  it('should not allow nesting a group inside a group', () => {
    render();
    component.instance().activesChange([
      { id: 2, name: 'single', container: '', index: 1 },
      {
        id: 1,
        name: 'group',
        container: '',
        index: 2,
        items: [
          { id: 1, name: 'filter1', container: '', index: 0 },
          { id: 1, name: 'filter2', container: '', index: 1 },
          { id: 1, name: 'group2', container: '', index: 1, items: [] },
        ],
      },
    ]);

    expect(component.state().activeFilters).toEqual([
      { id: 2, name: 'single', container: '', index: 1 },
      {
        id: 1,
        name: 'group',
        container: '',
        index: 2,
        items: [
          { id: 1, name: 'filter1', container: '', index: 0 },
          { id: 1, name: 'filter2', container: '', index: 1 },
        ],
      },
      { id: 1, name: 'group2', container: '', index: 1, items: [] },
    ]);
  });

  it('should render a DragAndDropContainer with the unactive filters', () => {
    render();
    const container = component.find(DragAndDropContainer).last();
    expect(container.props().items).toEqual(component.state().inactiveFilters);
  });

  describe('save', () => {
    it('should sanitize and call the api', () => {
      render();
      instance.activesChange([
        { id: 1, name: 'Country', container: '', index: 0 },
        {
          id: 'asd',
          name: 'Institutions',
          container: '',
          index: 2,
          items: [
            { id: 4, name: 'Court' },
            { id: 2, _id: 'someDbId', name: 'Case', container: '', index: 1 },
          ],
        },
      ]);
      spyOn(SettingsAPI, 'save').and.callFake(async () => Promise.resolve());
      instance.save();
      const expectedFilters = {
        data: {
          filters: [
            { id: 1, name: 'Country' },
            {
              id: 'asd',
              items: [
                { id: 4, name: 'Court' },
                { id: 2, name: 'Case' },
              ],
              name: 'Institutions',
            },
          ],
        },
        headers: {},
      };
      expect(SettingsAPI.save).toHaveBeenCalledWith(expectedFilters);
    });
  });
});
