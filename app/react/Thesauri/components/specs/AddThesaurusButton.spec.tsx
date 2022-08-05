/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { AddThesaurusButton } from '../AddThesaurusButton';
import * as thesaurusActions from '../../actions/thesauriActions';

describe('Add thesaurus button', () => {
  const render = () => {
    const store = { ...defaultState };
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
      await waitFor(() => {
        fireEvent.click(screen.getByText('Cancel').parentElement!);
      });

      expect(screen.queryByText('Thesaurus')).not.toBeInTheDocument();
    });

    it('should display an error if input is left empty', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should save with the correct format and close the modal', async () => {
      await waitFor(async () => {
        fireEvent.change(await screen.findByRole('textbox'), {
          target: { value: 'My new thesaurus' },
        });

        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(thesaurusActions.saveThesaurus).toHaveBeenCalledWith({
        name: 'My new thesaurus',
        values: [],
      });

      expect(screen.queryByText('Thesaurus')).not.toBeInTheDocument();
    });
  });
});
