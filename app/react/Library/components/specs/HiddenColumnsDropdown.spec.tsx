/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, fireEvent, act } from '@testing-library/react';

import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import * as actions from 'app/Library/actions/libraryActions';
import { HiddenColumnsDropdown } from '../HiddenColumnsDropdown';

describe('HiddenColumnsDropdown', () => {
  jest.mock('app/Library/actions/libraryActions');

  const storeState = {
    library: {
      ui: Immutable.fromJS({
        tableViewColumns: Immutable.fromJS([
          {
            label: 'Title',
            name: 'title',
            hidden: false,
          },
          {
            label: 'Text',
            name: 'text',
            hidden: false,
          },
          {
            label: 'Rich text',
            name: 'rich_text',
            hidden: true,
          },
        ]),
      }),
    },
  };

  describe('render', () => {
    const render = () => {
      const reduxStore = { ...defaultState, ...storeState };
      renderConnectedContainer(<HiddenColumnsDropdown />, () => reduxStore);
    };

    describe('default options', () => {
      beforeAll(() => {
        const hiddenAllAction = (action: boolean) => ({
          type: 'setTableAllHidden',
          hidden: action,
        });
        const hiddenAction = (name: string, action: boolean) => ({
          type: 'setTableHidden',
          name,
          hidden: action,
        });
        jest.spyOn(actions, 'setTableViewAllColumnsHidden').mockImplementation(hiddenAllAction);
        jest.spyOn(actions, 'setTableViewColumnHidden').mockImplementation(hiddenAction);
      });

      beforeEach(() => {
        render();
      });

      it('should display only expected options', async () => {
        await act(() => {
          fireEvent.click(screen.getByTitle('open dropdown'));
        });

        const options = screen.getAllByRole('option');
        expect(options.map(option => option.textContent)).toEqual([
          'Show all',
          'Text',
          'Rich text',
        ]);
      });

      it('should call action to hide all properties when selected is Show all and indeterminate', async () => {
        await act(() => {
          fireEvent.click(screen.getByTitle('open dropdown'));
        });

        const options = screen.getAllByRole('option');
        expect(options[0].textContent).toEqual('Show all');

        await act(() => {
          options[0].click();
        });

        expect(actions.setTableViewAllColumnsHidden).toHaveBeenCalledWith(false);
      });

      it('should call action update hidden property when a column is selected', async () => {
        await act(() => {
          fireEvent.click(screen.getByTitle('open dropdown'));
        });

        const options = screen.getAllByRole('option');
        expect(options[1].textContent).toEqual('Text');

        await act(() => {
          options[1].click();
        });

        expect(actions.setTableViewColumnHidden).toHaveBeenCalledWith('text', true);
        expect(options[2].textContent).toEqual('Rich text');

        await act(() => {
          options[2].click();
        });

        expect(actions.setTableViewColumnHidden).toHaveBeenCalledWith('rich_text', false);
      });
    });
  });
});
