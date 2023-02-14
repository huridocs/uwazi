/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import Immutable from 'immutable';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { AddThesaurusButton } from '../AddThesaurusButton';
import * as thesaurusActions from '../../actions/thesauriActions';

describe('Add thesaurus button', () => {
  const render = () => {
    const store = {
      ...defaultState,
      thesauris: Immutable.fromJS([
        {
          _id: '62ed536be92138e9c8797fe2',
          name: 'Existing thesaurus',
        },
        {
          default: true,
          name: 'New name',
          _id: '5bfbb1a0471dd0fc16ada146',
          type: 'template',
        },
      ]),
    };
    renderConnectedContainer(<AddThesaurusButton />, () => store);
  };

  it('should open the modal', () => {
    render();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('heading')).toHaveTextContent('Add thesaurus');
  });

  describe('modal', () => {
    beforeEach(() => {
      spyOn(thesaurusActions, 'saveThesaurus').and.returnValue({ type: 'saved' });
      render();
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    it('should close on cancel', async () => {
      await act(() => {
        fireEvent.click(screen.getByText('Cancel').parentElement!);
      });
      expect(screen.queryByText('Thesaurus')).not.toBeInTheDocument();
    });

    it('should display an error if input is left empty', async () => {
      await act(() => {
        fireEvent.click(screen.getByText('Save').parentElement!);
      });
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should display an error if the thesaurus name already exists', async () => {
      await act(async () => {
        fireEvent.change(await screen.findByRole('textbox'), {
          target: { value: 'Existing thesaurus' },
        });

        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(screen.getByText('Duplicated name')).toBeInTheDocument();
    });

    it('should save with the correct format and close the modal', async () => {
      await act(async () => {
        fireEvent.change(await screen.findByRole('textbox'), {
          target: { value: 'New name' },
        });

        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(thesaurusActions.saveThesaurus).toHaveBeenCalledWith({
        name: 'New name',
        values: [],
      });

      expect(screen.queryByText('Thesaurus')).not.toBeInTheDocument();
    });
  });
});
