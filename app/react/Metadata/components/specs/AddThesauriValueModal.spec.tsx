/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import AddThesauriValueModal, { AddThesauriValueModalProps } from '../AddThesauriValueModal';

describe('Add Add thesauri value', () => {
  const render = (props: AddThesauriValueModalProps) => {
    const store = {
      ...defaultState,
    };

    renderConnectedContainer(<AddThesauriValueModal {...props} />, () => store);
  };

  describe('modal', () => {
    const props: AddThesauriValueModalProps = {
      isOpen: true,
      onAccept: jest.fn(),
      onCancel: () => {},
      thesauri: {},
    };

    it('should display groups', async () => {
      props.thesauri = Immutable.fromJS({
        _id: 1,
        name: 'thesauri',
        values: [
          { label: 'label1', id: 'id1', values: [{ label: 'innerlabel1', id: 'innerid2' }] },
        ],
      });
      render(props);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should not display groups', async () => {
      props.thesauri = Immutable.fromJS({
        _id: 2,
        name: 'thesauri',
        values: [{ label: 'label1', id: 'id1' }],
      });
      render(props);
      expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('should call onAccept when form submitted', async () => {
      props.thesauri = Immutable.fromJS({
        _id: 3,
        name: 'thesauri',
        values: [
          { label: 'label1', id: 'id1', values: [{ label: 'innerlabel1', id: 'innerid2' }] },
        ],
      });
      render(props);
      const valueInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Value' });
      await waitFor(async () => {
        fireEvent.change(valueInput, { target: { value: 'testing' } });
        const submitButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(submitButton);
        expect(props.onAccept).toHaveBeenCalledWith({ group: 'root', value: 'testing' });
      });
    });
  });
});
