/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fromJS } from 'immutable';
import { RenderResult, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { SortDropdown } from '../SortDropdown';

describe('Sort dropdown', () => {
  let props: any;
  let renderResult: RenderResult;
  let search: string;

  const templates = [
    {
      _id: 'id',
      properties: [
        {},
        { filter: true, name: 'date', label: 'Date', type: 'date' },
        { filter: true, name: 'number', label: 'Number', type: 'numeric' },
        { filter: true, name: 'my_select', label: 'My select', type: 'select' },
        { filter: true, name: 'sortable_name', label: 'Sortable name', type: 'text' },
        {
          filter: true,
          name: 'inherited_1',
          label: 'Inherited 1',
          type: 'relationship',
          inherit: {
            type: 'text',
          },
        },
        {
          filter: true,
          name: 'non_sortable_property',
          label: 'Non sortable property',
          type: 'relationship',
          inherit: {
            type: 'multiselect',
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    props = {
      locale: 'en',
      templates: fromJS(templates),
      search: {
        order: 'asc',
        sort: 'creationDate',
        searchTerm: '',
      },
    };
    search = '(from:0,includeUnpublished:!t,limit:30,order:desc)';
  });

  const render = () => {
    ({ renderResult } = renderConnectedContainer(
      <SortDropdown.WrappedComponent {...props} />,
      () => ({
        ...defaultState,
      }),
      'MemoryRouter',
      [`/en/library/?q=${search}`]
    ));
  };

  it('should display sorting by creation date by default and have that option in the sort list', () => {
    render();
    const [sortButton, listOption] = screen.getAllByText('Date added');
    expect(sortButton.parentElement).toHaveClass('dropdown-button');
    expect(listOption.closest('a')).toHaveAttribute(
      'href',
      '/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:desc,sort:creationDate)'
    );
  });

  it.each`
    option             | link
    ${'Title'}         | ${'/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:asc,sort:title)'}
    ${'Date modified'} | ${'/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:desc,sort:editDate)'}
    ${'Date'}          | ${'/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:desc,sort:metadata.date)'}
    ${'Number'}        | ${'/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:desc,sort:metadata.number)'}
    ${'My select'}     | ${'/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:asc,sort:metadata.my_select)'}
    ${'Sortable name'} | ${'/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:asc,sort:metadata.sortable_name)'}
    ${'Inherited 1'}   | ${'/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:desc,sort:metadata.inherited_1.inheritedValue)'}
  `(
    'should display the sortable option $option with the link, and correct sort and order',
    ({ option, link }) => {
      render();
      expect(screen.getByText(option).closest('a')).toHaveAttribute('href', link);
    }
  );

  it('should not display properties that are not sortable', () => {
    render();
    expect(screen.queryByText('Non sortable property')).not.toBeInTheDocument();
  });

  it('should not duplicate the entry when multiple options have the same property name', () => {
    props.templates = fromJS([
      {
        _id: 'id1',
        properties: [
          {
            filter: true,
            name: 'sortable_text',
            label: 'My text',
            type: 'text',
            _id: '_id',
          },
        ],
      },
      {
        _id: 'id2',
        properties: [
          {
            filter: true,
            name: 'sortable_text',
            label: 'My text',
            type: 'text',
            _id: '_id',
          },
        ],
      },
    ]);

    render();
    const listOption = screen.getAllByText('My text');
    expect(listOption.length).toBe(1);
  });

  describe('when there is an active search term', () => {
    it('should display sort by search relevance option in the button and in the list, and disable the sort button', () => {
      search = "(searchTerm:'my search',sort:_score)";
      render();
      const byRelevanceText = screen.getAllByText('Search relevance');
      expect(byRelevanceText).toHaveLength(2);
      expect(renderResult.container).toMatchSnapshot();
    });
  });

  describe('sort button', () => {
    it('should reverte the sorting order and keep other parameters as they are', () => {
      render();
      expect(screen.getByText('Sort ascending').parentElement?.parentElement).toHaveAttribute(
        'href',
        '/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:asc)'
      );

      search = "(from:0,includeUnpublished:!t,limit:30,order:asc,searchTerm:'some search')";
      render();
      expect(screen.getByText('Sort descending').parentElement?.parentElement).toHaveAttribute(
        'href',
        "/en/library/?q=(from:0,includeUnpublished:!t,limit:30,order:desc,searchTerm:'some search')"
      );
    });
  });
});
