/* eslint-disable camelcase */
import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { DocumentTypesList } from '../DocumentTypesList';

describe('DocumentTypesList', () => {
  let component;
  let props;
  let filters;
  let aggregations;

  const allTemplates = [
    { id: 0, name: 'Case' },
    { id: 1, name: 'Judge' },
    { id: 2, name: 'Country' },
    {
      id: 3,
      name: 'Documents',
      items: [
        { id: 4, name: 'Decision' },
        { id: 5, name: 'Cause' },
      ],
    },
  ];

  beforeEach(() => {
    filters = [
      { id: 1, name: 'Judge' },
      { id: 2, name: 'Country' },
      {
        id: 3,
        name: 'Documents',
        items: [
          { id: 4, name: 'Decision' },
          { id: 5, name: 'Cause' },
        ],
      },
    ];

    aggregations = {
      all: {
        types: {
          buckets: [
            { doc_count: 23, key: 1, filtered: { doc_count: 7 } },
            { doc_count: 43, key: 2, filtered: { doc_count: 2 } },
            { doc_count: 31, key: 4, filtered: { doc_count: 4 } },
            { doc_count: 68, key: 5, filtered: { doc_count: 9 } },
          ],
        },
      },
    };

    props = {
      filterDocumentTypes: jasmine.createSpy('filterDocumentTypes'),
      settings: { collection: Immutable.fromJS({ filters }) },
      aggregations: Immutable.fromJS(aggregations),
      storeKey: 'library',
      templates: Immutable.fromJS(allTemplates),
      selectedTemplates: [2, 5],
      location: { search: '?q=(searchTerm:%27asd%27)' },
      navigate: jest.fn(),
    };
  });

  const render = (customProps = {}) => {
    const componentProps = { ...props, ...customProps };
    component = shallow(<DocumentTypesList {...componentProps} />);
  };

  describe('render', () => {
    it('should render a li element for each option', () => {
      render();
      const liElements = component.find('li');
      expect(liElements.length).toBe(5);
    });

    it('should render a sublist for types groups', () => {
      render();
      const liElements = component.find('li').at(2).find('ul').find('li');
      expect(liElements.length).toBe(2);
    });

    it('should render as checked the selected types', () => {
      render();
      const liElements = component.find('li');
      expect(liElements.at(1).find('input').props().checked).toBe(true);
    });
  });

  describe('listed templates', () => {
    const checkExpectedList = expectedList => {
      const templatesOptions = component
        .find('li .multiselectItem-name')
        .children()
        .map(name => name.props().children);
      expect(templatesOptions).toEqual(expectedList);
    };
    it('should list all the templates if fromFilters is false', () => {
      render({ fromFilters: false });
      checkExpectedList(['Case', 'Judge', 'Country', 'Documents']);
    });

    it.each([true, undefined])(
      'should list just the filters when fromFilters is true',
      fromFilters => {
        render({ fromFilters });
        checkExpectedList(['Judge', 'Country', 'Documents', 'Decision', 'Cause']);
      }
    );
  });

  describe('clicking on a type', () => {
    it('should check it', () => {
      render();
      const liElements = component.find('li');
      liElements.at(0).find('input').simulate('change');
      expect(props.filterDocumentTypes).toHaveBeenCalledWith(
        [2, 5, 1],
        props.location,
        props.navigate
      );
    });

    describe('when is a group', () => {
      it('should select all the items', () => {
        render();
        const liElements = component.find('li');
        liElements
          .at(2)
          .find('input')
          .first()
          .simulate('change', { target: { checked: true } });
        expect(props.filterDocumentTypes).toHaveBeenCalledWith(
          [2, 5, 4],
          props.location,
          props.navigate
        );

        liElements
          .at(2)
          .find('input')
          .first()
          .simulate('change', { target: { checked: false } });
        expect(props.filterDocumentTypes).toHaveBeenCalledWith([2], props.location, props.navigate);
      });
    });
  });
});
