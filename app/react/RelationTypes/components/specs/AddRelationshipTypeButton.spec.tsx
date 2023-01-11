/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, fireEvent, act } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { AddRelationshipTypeButton } from '../AddRelationshipTypeButton';
import * as relationTypeActions from '../../actions/relationTypeActions';

describe('Add relationship type button', () => {
  const render = () => {
    const store = {
      ...defaultState,
      relationTypes: Immutable.fromJS([
        {
          _id: '62ed4e49e92138e9c879680a',
          name: 'Existing relationship type',
          properties: [],
        },
      ]),
    };
    renderConnectedContainer(<AddRelationshipTypeButton />, () => store);
  };

  it('should open the modal', () => {
    render();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('heading')).toHaveTextContent('Add relationship type');
  });

  describe('modal', () => {
    beforeEach(() => {
      spyOn(relationTypeActions, 'saveRelationType').and.returnValue({ type: 'saved' });
      render();
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    it('should close on cancel', async () => {
      await act(() => {
        fireEvent.click(screen.getByText('Cancel').parentElement!);
      });

      expect(screen.queryByText('Relationship')).not.toBeInTheDocument();
    });

    it('should display an error if input is left empty', async () => {
      await act(() => {
        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should display an error if the relationship type name already exists', async () => {
      await act(async () => {
        fireEvent.change(await screen.findByRole('textbox'), {
          target: { value: 'Existing relationship type' },
        });

        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(screen.getByText('Duplicated name')).toBeInTheDocument();
    });

    it('should save with the correct format and close the modal', async () => {
      await act(async () => {
        fireEvent.change(await screen.findByRole('textbox'), {
          target: { value: 'My new relationship type' },
        });

        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(relationTypeActions.saveRelationType).toHaveBeenCalledWith({
        name: 'My new relationship type',
        properties: [],
      });

      expect(screen.queryByText('Relationship')).not.toBeInTheDocument();
    });
  });
});
