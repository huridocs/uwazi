/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { AddRelationTypeButton } from '../AddRelationTypeButton';
import * as relationTypeActions from '../../actions/relationTypeActions';

describe('Add relation type button', () => {
  const render = () => {
    const store = {
      ...defaultState,
      relationTypes: Immutable.fromJS([
        {
          _id: '62ed4e49e92138e9c879680a',
          name: 'Existing relation type',
          properties: [],
        },
      ]),
    };
    renderConnectedContainer(<AddRelationTypeButton />, () => store);
  };

  it('should open the modal', () => {
    render();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('heading')).toHaveTextContent('Add relation type');
  });

  describe('modal', () => {
    beforeEach(() => {
      spyOn(relationTypeActions, 'saveRelationType').and.returnValue({ type: 'saved' });
      render();
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    it('should close on cancel', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByText('Cancel').parentElement!);
      });

      expect(screen.queryByText('Relation')).not.toBeInTheDocument();
    });

    it('should display an error if input is left empty', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should display an error if the thesaurus name already exists', async () => {
      await waitFor(async () => {
        fireEvent.change(await screen.findByRole('textbox'), {
          target: { value: 'Existing relation type' },
        });

        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(screen.getByText('Duplicated name')).toBeInTheDocument();
    });

    it('should save with the correct format and close the modal', async () => {
      await waitFor(async () => {
        fireEvent.change(await screen.findByRole('textbox'), {
          target: { value: 'My new relation type' },
        });

        fireEvent.click(screen.getByText('Save').parentElement!);
      });

      expect(relationTypeActions.saveRelationType).toHaveBeenCalledWith({
        name: 'My new relation type',
        properties: [],
      });

      expect(screen.queryByText('Relation')).not.toBeInTheDocument();
    });
  });
});
