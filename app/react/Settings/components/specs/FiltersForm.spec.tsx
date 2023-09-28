/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fromJS } from 'immutable';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import ID from 'shared/uniqueID';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { FiltersForm } from '../FiltersForm';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => jest.fn(),
}));

/* eslint-disable comma-spacing */
jest.mock('app/componentWrappers', () => {
  const dnd = jest.requireActual('react-dnd');
  return {
    ...jest.requireActual('app/componentWrappers'),
    withDnD:
      <T,>(Component: React.FC<T>, _moduleImport: Function, _extractor: (module: unknown) => {}) =>
      (props: T & { key?: string }) => (
        <Component
          {...props}
          useDrag={dnd.useDrag}
          useDrop={dnd.useDrop}
          useDragDropManager={dnd.useDragDropManager}
        />
      ),
  };
});

beforeEach(async () => {
  spyOn(SettingsAPI, 'save').and.callFake(async () => Promise.resolve());

  const reduxStore = {
    ...defaultState,
    settings: {
      collection: fromJS({
        filters: [
          { name: 'Country', type: 'link', id: 'template2', _id: 'template2' },
          { name: 'Case', type: 'link', id: 'template3', _id: 'template3' },
          {
            name: 'Institutions',
            type: 'group',
            id: ID(),
            items: [{ name: 'Court', type: 'link', id: 'template1', _id: 'template1' }],
          },
        ],
      }),
    },
    templates: fromJS([
      { _id: 'template1', name: 'Court' },
      { _id: 'template2', name: 'Country' },
      { _id: 'template3', name: 'Case' },
      { _id: 'template4', name: 'Judge' },
      { _id: 'template5', name: 'Lawer' },
    ]),
  };
  renderConnectedContainer(
    <DndProvider backend={HTML5Backend}>
      <FiltersForm />
    </DndProvider>,
    () => ({
      ...reduxStore,
    }),
    'MemoryRouter',
    ['']
  );
});

describe('FiltersForm', () => {
  it('should list active filters', async () => {
    const activeFiltersContainer = screen.getByTestId('active_filters_root');
    const results = within(activeFiltersContainer)
      .getAllByTestId('filter_link')
      .map(i => i.textContent);
    expect(results).toEqual(['Country', 'Case', 'Court']);
  });

  it('should list groups', async () => {
    const activeFiltersContainer = screen.getByTestId('active_filters_root');
    const groupName = within(activeFiltersContainer).getByRole('textbox').getAttribute('value');

    expect(groupName).toEqual('Institutions');
  });

  it('should list inactive Filters', () => {
    const inActiveFiltersContainer = screen.getByTestId('inactive_filters_root');
    const availableFilters = within(inActiveFiltersContainer)
      .getAllByRole('listitem')
      .map(i => i.textContent);

    expect(availableFilters).toEqual(['Judge', 'Lawer']);
  });

  describe('Filters edition', () => {
    it('should add a group', async () => {
      await act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Create group' }));
      });
      const activeFiltersContainer = screen.getByTestId('active_filters_root');
      const groups = within(activeFiltersContainer).getAllByRole('textbox');
      expect(groups.length).toEqual(2);
      expect(groups.at(1)?.getAttribute('value')).toEqual('New group');
    });

    // eslint-disable-next-line max-statements
    it('should add a filter to the group', async () => {
      // eslint-disable-next-line max-statements
      await act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Create group' }));
      });
      const judgeFilter = screen.getByText('Judge');
      const container = screen.getByTestId('group_New group');
      fireEvent.dragStart(judgeFilter);
      fireEvent.dragEnter(container);
      fireEvent.drop(container);

      const updatedFiltersContainer = screen.getByTestId('active_filters_root');
      const results = within(updatedFiltersContainer)
        .getAllByTestId('filter_link')
        .map(i => i.textContent);
      expect(results).toEqual(['Country', 'Case', 'Court', 'Judge']);

      const inActiveFiltersContainer = screen.getByTestId('inactive_filters_root');
      const availableFilters = within(inActiveFiltersContainer)
        .getAllByRole('listitem')
        .map(i => i.textContent);

      expect(availableFilters).toEqual(['Lawer']);
    });

    it('should sanitize and call the api', async () => {
      await act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });

      expect(SettingsAPI.save).toHaveBeenCalledWith(
        new RequestParams({
          filters: [
            {
              _id: 'template2',
              id: 'template2',
              name: 'Country',
              items: undefined,
              type: 'link',
            },
            { _id: 'template3', id: 'template3', name: 'Case', items: undefined, type: 'link' },
            {
              id: expect.any(String),
              items: [{ id: 'template1', name: 'Court', type: 'link' }],
              name: 'Institutions',
              type: 'group',
            },
          ],
        })
      );
    });
  });
});
