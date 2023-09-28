/**
 * @jest-environment jsdom
 */
import React, { Suspense } from 'react';
import { fromJS } from 'immutable';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import ID from 'shared/uniqueID';
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
      <Suspense fallback={<div>Loading...</div>}>
        <FiltersForm />
      </Suspense>
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
  // it('should set the state with the inactiveFilters', () => {
  //   render();
  //   expect(component.state().inactiveFilters).toEqual([{ id: 3, name: 'Judge' }]);
  // });

  // it('should render a DragAndDropContainer with the active filters', () => {
  //   render();
  //   const container = component.find(DragAndDropContainer).first();
  //   expect(container.props().items).toEqual(component.state().activeFilters);
  // });

  // it('should not allow nesting a group inside a group', () => {
  //   render();
  //   component.instance().activesChange([
  //     { id: 2, name: 'single', container: '', index: 1 },
  //     {
  //       id: 1,
  //       name: 'group',
  //       container: '',
  //       index: 2,
  //       items: [
  //         { id: 1, name: 'filter1', container: '', index: 0 },
  //         { id: 1, name: 'filter2', container: '', index: 1 },
  //         { id: 1, name: 'group2', container: '', index: 1, items: [] },
  //       ],
  //     },
  //   ]);

  //   expect(component.state().activeFilters).toEqual([
  //     { id: 2, name: 'single', container: '', index: 1 },
  //     {
  //       id: 1,
  //       name: 'group',
  //       container: '',
  //       index: 2,
  //       items: [
  //         { id: 1, name: 'filter1', container: '', index: 0 },
  //         { id: 1, name: 'filter2', container: '', index: 1 },
  //       ],
  //     },
  //     { id: 1, name: 'group2', container: '', index: 1, items: [] },
  //   ]);
  // });

  // it('should render a DragAndDropContainer with the unactive filters', () => {
  //   render();
  //   const container = component.find(DragAndDropContainer).last();
  //   expect(container.props().items).toEqual(component.state().inactiveFilters);
  // });

  // describe('save', () => {
  //   it('should sanitize and call the api', () => {
  //     render();
  //     instance.activesChange([
  //       { id: 1, name: 'Country', container: '', index: 0 },
  //       {
  //         id: 'asd',
  //         name: 'Institutions',
  //         container: '',
  //         index: 2,
  //         items: [
  //           { id: 4, name: 'Court' },
  //           { id: 2, _id: 'someDbId', name: 'Case', container: '', index: 1 },
  //         ],
  //       },
  //     ]);
  //     spyOn(SettingsAPI, 'save').and.callFake(async () => Promise.resolve());
  //     instance.save();
  //     const expectedFilters = {
  //       data: {
  //         filters: [
  //           { id: 1, name: 'Country' },
  //           {
  //             id: 'asd',
  //             items: [
  //               { id: 4, name: 'Court' },
  //               { id: 2, name: 'Case' },
  //             ],
  //             name: 'Institutions',
  //           },
  //         ],
  //       },
  //       headers: {},
  //     };
  //     expect(SettingsAPI.save).toHaveBeenCalledWith(expectedFilters);
  //   });
  // });
});
