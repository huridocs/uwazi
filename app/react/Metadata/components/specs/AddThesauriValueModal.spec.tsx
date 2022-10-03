/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      values: [],
    };

    describe('when thesauri has groups', () => {
      it('should display groups', async () => {
        props.values = [
          { label: 'label1', id: 'id1', values: [{ label: 'innerlabel1', id: 'innerid2' }] },
        ];
        render(props);
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });
    });

    describe('when thesauri has NO groups', () => {
      it('should not display groups', async () => {
        props.values = [{ label: 'label1', id: 'id1' }];
        render(props);
        expect(screen.queryByRole('combobox')).toBeNull();
      });
    });

    it('should call onAccept when form submitted', async () => {
      props.values = [
        { label: 'label1', id: 'id1', values: [{ label: 'innerlabel1', id: 'innerid2' }] },
      ];
      render(props);
      const valueInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Value' });
      await waitFor(async () => {
        fireEvent.change(valueInput, { target: { value: 'testing' } });
        const submitButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(submitButton);
        expect(props.onAccept).toHaveBeenCalledWith({ group: 'root', value: 'testing' });
      });
    });

    it('should display error when duplicate root values are found', async () => {
      props.values = [{ label: 'label1', id: 'id1' }];
      render(props);
      const valueInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Value' });
      await waitFor(async () => {
        fireEvent.change(valueInput, { target: { value: 'label1' } });
        const submitButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(submitButton);
        const error = screen.getByRole('alert');
        expect(error).toBeTruthy();
        await expect(error.children[0].textContent).toMatch(/Duplicate/);
      });
    });

    it('should display error when duplicated nested values are found', async () => {
      props.values = [
        { label: 'label1', id: 'id1', values: [{ label: 'inner1', id: 'innerId1' }] },
      ];
      render(props);
      const valueInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Value' });
      const groupSelect = screen.getByRole('combobox');
      await waitFor(async () => {
        await userEvent.selectOptions(groupSelect, screen.getByText('label1'));
        fireEvent.change(valueInput, { target: { value: 'inner1' } });
        const submitButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(submitButton);
        const error = screen.getByRole('alert');
        expect(error).toBeTruthy();
        await expect(error.children[0].textContent).toMatch(/Duplicate/);
      });
    });
  });
});
