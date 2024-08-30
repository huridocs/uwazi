/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React, { act } from 'react';
import { IncomingHttpHeaders } from 'http';
import {
  fireEvent,
  RenderResult,
  screen,
  waitFor,
  within,
  render,
  cleanup,
} from '@testing-library/react/pure';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import { Provider } from 'react-redux';
import { has } from 'lodash';
import { templatesAtom } from 'app/V2/atoms';
import { atomsGlobalState, reduxStore } from 'V2/shared/testingHelpers';
import { ThesauriList, thesauriLoader } from '../ThesauriList';
import { EditThesaurus } from '../EditThesaurus';
import { editThesaurusLoader } from '../helpers';
import { savedThesaurus, thesauri } from './fixtures';

const deleteFn = jest.fn();
const saveFn = jest.fn();
const mockUseLoaderData = jest
  .fn()
  .mockImplementation((params, _headers) => (!has(params, '_id') ? thesauri : [savedThesaurus]));
const mockDeleteThesauri = deleteFn.mockImplementation((_params, _headers) => ({
  ok: true,
}));
const mockSaveThesauri = saveFn.mockImplementation(_params => savedThesaurus);

jest.mock('app/V2/api/thesauri', () => ({
  __esModule: true,
  default: {
    ...jest.requireActual('app/V2/api/thesauri').default,
    getThesauri: (params: { _id: string }, headers?: IncomingHttpHeaders) =>
      mockUseLoaderData(params, headers),
    delete: (params: { _id: string }) => mockDeleteThesauri(params),
    save: (params: { _id: string }) => mockSaveThesauri(params),
  },
}));

describe('Settings Thesauri', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('ThesauriList', () => {
    let renderResult: RenderResult;
    const store = atomsGlobalState();
    store.set(templatesAtom, [
      {
        _id: 'template1',
        name: 'Document',
        properties: [
          {
            _id: 'property1',
            name: 'prop1',
            label: 'property1',
            type: 'select',
            content: 'thesaurus2',
          },
          {
            _id: 'property2',
            name: 'prop2',
            label: 'property2',
            type: 'select',
            content: 'newThesaurus1',
          },
        ],
      },
    ]);
    const router = createMemoryRouter(
      [
        {
          index: true,
          path: '/',
          element: <ThesauriList />,
          loader: thesauriLoader({}),
        },
        { path: '/settings/thesauri/new', element: <EditThesaurus /> },
        {
          path: '/settings/thesauri/edit/newThesaurus1',
          element: <EditThesaurus />,
          loader: editThesaurusLoader({}),
        },
        {
          path: '/edit/newThesaurus1',
          element: <EditThesaurus />,
          loader: editThesaurusLoader({}),
        },
      ],
      {
        initialEntries: ['/'],
      }
    );

    const renderComponent = () =>
      render(
        <Provider store={reduxStore}>
          <JotaiProvider store={store}>
            <RouterProvider router={router} />
          </JotaiProvider>
        </Provider>
      );

    let rows: HTMLElement[];

    const clickOnAction = async (row: number, column: number, role = 'button') => {
      await act(async () => {
        fireEvent.click(within(rows[row].children[column] as HTMLElement).getByRole(role));
      });
    };

    beforeAll(async () => {
      renderResult = renderComponent();
      rows = await waitFor(() => screen.getAllByRole('row'));
    });

    afterAll(() => {
      cleanup();
    });

    const checkRightSaving = async (expectedParams: any) => {
      await act(async () => {
        fireEvent.click(
          within(screen.getByTestId('settings-content-footer')).getByText('Save').parentNode!
        );
      });
      expect(saveFn).toHaveBeenLastCalledWith(expectedParams);
    };

    describe('render existing thesauri', () => {
      it('should show a list of existing thesauri', async () => {
        expect(renderResult.container).toMatchSnapshot();
      });
      it('should not allow to delete used thesaurus', async () => {
        rows = await waitFor(() => screen.getAllByRole('row'));
        const usedThesaurusCheckbox = within(rows[3].children[0] as HTMLElement).getByRole(
          'checkbox'
        );
        expect(usedThesaurusCheckbox).toHaveAttribute('disabled');
      });
    });
    describe('Thesaurus deletion', () => {
      it('should show the selected thesaurus', async () => {
        await clickOnAction(1, 0, 'checkbox');
        await clickOnAction(2, 0, 'checkbox');
        expect(screen.getByTestId('settings-content-footer')).toMatchSnapshot();
        await clickOnAction(0, 0, 'checkbox');
      });

      it('should ask for confirmation to delete the selection', async () => {
        await clickOnAction(1, 0, 'checkbox');
        await clickOnAction(2, 0, 'checkbox');
        await act(async () => {
          fireEvent.click(screen.getByTestId('thesaurus-delete-link'));
        });
        await act(async () => {
          expect(
            screen.getByText('Are you sure you want to delete this item?')
          ).toBeInTheDocument();
          expect(within(screen.getByTestId('modal-body')).getByText('Animals')).toBeInTheDocument();
          expect(within(screen.getByTestId('modal-body')).getByText('Colors')).toBeInTheDocument();
        });
        await act(async () => {
          fireEvent.click(screen.getByTestId('cancel-button'));
        });
        await act(async () => {
          expect(renderResult.container.getElementsByTagName('tbody')).toMatchSnapshot();
        });
        await act(async () => {
          fireEvent.click(screen.getByTestId('thesaurus-delete-link'));
        });
        await act(async () => {
          fireEvent.click(screen.getByTestId('accept-button'));
        });
        await act(async () => {
          expect(deleteFn).toHaveBeenCalledTimes(2);
          expect(deleteFn).toHaveBeenLastCalledWith({ _id: 'thesaurus3' });
        });
        await clickOnAction(0, 0, 'checkbox');
      });
    });
    const editRow = async (label: string, mainValue: string, secondValue: string) => {
      await act(async () => {
        const newItemForm = renderResult.container.getElementsByTagName('form')[1];
        fireEvent.change(within(newItemForm).getByLabelText(label) as HTMLInputElement, {
          target: { value: mainValue },
        });
        fireEvent.change(within(newItemForm).getAllByRole('textbox')[1], {
          target: { value: secondValue },
        });
        fireEvent.click(screen.getByTestId('thesaurus-form-submit'));
      });
    };

    describe('Add Thesaurus', () => {
      it('should add single thesaurus values', async () => {
        await act(async () => {
          fireEvent.click(screen.getByText('Add thesaurus').parentNode!);
        });
        fireEvent.change(screen.getByPlaceholderText('Thesauri name'), {
          target: { value: 'new thesaurus' },
        });
        await act(async () => {
          fireEvent.click(screen.getByText('Add item').parentNode!);
        });
        await editRow('Title', 'single value 1', 'single value 2');
        await act(async () => {
          rows = await waitFor(() => screen.getAllByRole('row'));
          expect(rows.length).toBe(3);
        });
      });

      it('should not add an empty group', async () => {
        await act(async () => {
          fireEvent.click(screen.getByText('Add group').parentNode!);
        });
        let newItemForm: HTMLElement;
        await act(async () => {
          [, newItemForm] = renderResult.container.getElementsByTagName('form');
          fireEvent.change(within(newItemForm).getByLabelText('Name') as HTMLInputElement, {
            target: { value: 'Group 1' },
          });
          fireEvent.click(screen.getByTestId('thesaurus-form-submit'));
        });
        await act(async () => {
          expect(screen.getByText('This field is required')).toBeInTheDocument();
          fireEvent.click(within(newItemForm).getByTestId('thesaurus-form-cancel'));
        });
      });

      it('should add a group to thesaurus', async () => {
        await act(async () => {
          fireEvent.click(screen.getByText('Add group').parentNode!);
        });
        await editRow('Name', 'Group 1', 'Child 1');
        await act(async () => {
          rows = await waitFor(() => screen.getAllByRole('row'));
          expect(rows.length).toBe(4);
        });
      });

      it('should not allow edit the group of an item', async () => {
        await clickOnAction(1, 4, 'button');
        await act(async () => {
          const newItemForm = renderResult.container.getElementsByTagName('form')[1];
          expect(within(newItemForm).getByLabelText('Group')).toHaveAttribute('disabled');
          fireEvent.click(within(newItemForm).getByTestId('thesaurus-form-cancel'));
        });
      });

      it('should not add a row if the item label is empty', async () => {
        await act(async () => {
          fireEvent.click(screen.getByText('Add item').parentNode!);
        });
        await act(async () => {
          fireEvent.click(screen.getByTestId('thesaurus-form-submit'));
        });
        await act(async () => {
          expect(rows.length).toBe(4);
        });
      });

      it('should require the name of the group', async () => {
        await act(async () => {
          fireEvent.click(screen.getByText('Add group').parentNode!);
        });
        let newItemForm: HTMLElement;
        await act(async () => {
          [, newItemForm] = renderResult.container.getElementsByTagName('form');
          fireEvent.click(screen.getByTestId('thesaurus-form-submit'));
        });
        await act(async () => {
          expect(screen.getAllByText('This field is required')).toHaveLength(2);
          fireEvent.click(within(newItemForm).getByTestId('thesaurus-form-cancel'));
        });
      });
      it('should add items into an existing group', async () => {
        await act(async () => {
          fireEvent.click(screen.getByText('Add item').parentNode!);
        });
        await act(async () => {
          const newItemForm = renderResult.container.getElementsByTagName('form')[1];
          fireEvent.change(within(newItemForm).getByLabelText('Title') as HTMLInputElement, {
            target: { value: 'new child 2' },
          });
          fireEvent.click(within(newItemForm).getAllByLabelText('Group')[0]);
        });
        await act(async () => {
          fireEvent.change(screen.getByLabelText('Group'), {
            target: {
              value: (screen.getAllByRole('option')[1] as HTMLInputElement).value,
            },
          });
          fireEvent.click(screen.getByTestId('thesaurus-form-submit'));
        });
        await act(async () => {
          rows = await waitFor(() => screen.getAllByRole('row'));
          expect(rows.length).toBe(4);
        });
      });

      it('should prevent leaving without saving', async () => {
        fireEvent.click(screen.getByText('Cancel').parentNode!);
        await act(async () => {
          expect(screen.getByText('Discard changes')).toBeInTheDocument();
          fireEvent.click(within(screen.getByTestId('modal')).getByText('Cancel').parentNode!);
        });
      });

      it('should save the new thesaurus', async () => {
        await checkRightSaving({
          name: 'new thesaurus',
          values: [
            {
              label: 'single value 1',
            },
            {
              label: 'single value 2',
            },
            {
              label: 'Group 1',
              values: [
                {
                  label: 'Child 1',
                },
                {
                  label: 'new child 2',
                },
              ],
            },
          ],
        });
      });
    });

    describe('Edit Thesaurus', () => {
      it('should edit a root item', async () => {
        rows = await waitFor(() => screen.getAllByRole('row'));
        fireEvent.click(within(rows[1].children[4] as HTMLElement).getByRole('button'));
        await act(async () => {
          const newItemForm = renderResult.container.getElementsByTagName('form')[1];
          fireEvent.change(within(newItemForm).getByLabelText('Title'), {
            target: { value: 'MODIFIED SINGLE VALUE' },
          });
          fireEvent.click(within(newItemForm).getByTestId('thesaurus-form-submit'));
        });
        expect(within(screen.getByRole('table')).getAllByText('MODIFIED SINGLE VALUE').length).toBe(
          2
        );
        await checkRightSaving({
          _id: 'newThesaurus1',
          name: 'new thesaurus',
          values: [
            { id: 'item1', label: 'MODIFIED SINGLE VALUE' },
            { id: 'item2', label: 'single value 2' },
            {
              id: 'item3',
              label: 'Group 1',
              values: [
                {
                  id: 'item3-1',
                  label: 'Child 1',
                },
                { id: 'item3-2', label: 'new child 2' },
              ],
            },
          ],
        });
      });

      it('should edit a root group', async () => {
        rows = await waitFor(() => screen.getAllByRole('row'));
        fireEvent.click(within(rows[3].children[4] as HTMLElement).getByRole('button'));
        await act(async () => {
          const newItemForm = renderResult.container.getElementsByTagName('form')[1];
          fireEvent.change(within(newItemForm).getAllByRole('textbox')[0], {
            target: { value: 'CHANGED GROUP' },
          });
          fireEvent.change(within(newItemForm).getAllByRole('textbox')[3], {
            target: { value: 'ADDED CHILD' },
          });
          fireEvent.click(within(newItemForm).getByTestId('thesaurus-form-submit'));
        });
        await checkRightSaving({
          _id: 'newThesaurus1',
          name: 'new thesaurus',
          values: [
            { id: 'item1', label: 'MODIFIED SINGLE VALUE' },
            { id: 'item2', label: 'single value 2' },
            {
              id: 'item3',
              label: 'CHANGED GROUP',
              values: [
                {
                  id: 'item3-1',
                  label: 'Child 1',
                },
                { id: 'item3-2', label: 'new child 2' },
                { label: 'ADDED CHILD' },
              ],
            },
          ],
        });
      });
      it('should add additional items', async () => {
        await act(async () => {
          fireEvent.click(screen.getByText('Add item').parentNode!);
        });
        let newItemForm: HTMLElement;
        await act(async () => {
          [, newItemForm] = renderResult.container.getElementsByTagName('form');
          fireEvent.change(within(newItemForm).getByLabelText('Title') as HTMLInputElement, {
            target: { value: 'X item' },
          });
          fireEvent.click(within(newItemForm).getAllByLabelText('Group')[0]);
        });

        await act(async () => {
          fireEvent.change(screen.getByLabelText('Group'), {
            target: {
              value: (screen.getAllByRole('option')[1] as HTMLInputElement).value,
            },
          });
          fireEvent.change(within(newItemForm).getAllByRole('textbox')[1], {
            target: { value: 'Additional item' },
          });
          fireEvent.click(screen.getByTestId('thesaurus-form-submit'));
        });
        expect(within(screen.getByRole('table')).getAllByText('Additional item').length).toBe(2);
        await checkRightSaving({
          _id: 'newThesaurus1',
          name: 'new thesaurus',
          values: [
            { id: 'item1', label: 'MODIFIED SINGLE VALUE' },
            { id: 'item2', label: 'single value 2' },
            {
              id: 'item3',
              label: 'CHANGED GROUP',
              values: [
                {
                  id: 'item3-1',
                  label: 'Child 1',
                },
                {
                  id: 'item3-2',
                  label: 'new child 2',
                },
                { label: 'ADDED CHILD' },
                { label: 'X item' },
              ],
            },
            {
              label: 'Additional item',
            },
          ],
        });
      });
      it('should remove an existent item', async () => {
        rows = await waitFor(() => screen.getAllByRole('row'));
        await act(async () => {
          fireEvent.click(within(rows[2].children[1] as HTMLElement).getByRole('checkbox'));
          fireEvent.click(within(rows[3].children[2] as HTMLElement).getByRole('button'));
        });
        rows = await waitFor(() => screen.getAllByRole('row'));
        await act(async () => {
          fireEvent.click(within(rows[5].children[1] as HTMLElement).getByRole('checkbox'));
        });
        await act(async () => {
          fireEvent.click(screen.getByText('Remove').parentNode!);
        });
        await act(async () => {
          expect(
            screen.getByText('Are you sure you want to delete this item?')
          ).toBeInTheDocument();
          fireEvent.click(within(screen.getByTestId('modal')).getByTestId('accept-button'));
        });
        expect(within(screen.getByRole('table')).queryAllByText('single value 2').length).toBe(0);
        await checkRightSaving({
          _id: 'newThesaurus1',
          name: 'new thesaurus',
          values: [
            { id: 'item1', label: 'MODIFIED SINGLE VALUE' },
            {
              id: 'item3',
              label: 'CHANGED GROUP',
              values: [
                {
                  id: 'item3-1',
                  label: 'Child 1',
                },
                { label: 'ADDED CHILD' },
                { label: 'X item' },
              ],
            },
            {
              label: 'Additional item',
            },
          ],
        });
      });
      it('should sort the items', async () => {
        await act(async () => {
          fireEvent.click(
            within(screen.getByTestId('settings-content-footer')).getByText('Sort').parentNode!
          );
        });
        await checkRightSaving({
          _id: 'newThesaurus1',
          name: 'new thesaurus',
          values: [
            { label: 'Additional item' },
            {
              id: 'item3',
              label: 'CHANGED GROUP',
              values: [
                { label: 'ADDED CHILD' },
                {
                  id: 'item3-1',
                  label: 'Child 1',
                },
                { label: 'X item' },
              ],
            },
            {
              id: 'item1',
              label: 'MODIFIED SINGLE VALUE',
            },
          ],
        });
      });
    });
  });
});
