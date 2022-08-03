/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { MetadataTemplateModal, MetadataTemplateModalProps } from '../MetadataTemplateModal';

describe('Metadata template modal', () => {
  let componentProps: MetadataTemplateModalProps;
  const reduxStore = {};

  const render = ({ isOpen, type, cancelFunction, saveFunction }: MetadataTemplateModalProps) => {
    const store = { ...defaultState, ...reduxStore };
    renderConnectedContainer(
      <MetadataTemplateModal
        isOpen={isOpen}
        type={type}
        cancelFunction={cancelFunction}
        saveFunction={saveFunction}
      />,
      () => store
    );
  };

  beforeEach(() => {
    componentProps = {
      isOpen: true,
      type: 'relationship',
      saveFunction: () => {},
      cancelFunction: () => {},
    };
  });

  it('should render the modal for new relation types', async () => {
    render(componentProps);

    expect(await screen.findByText('Add relation type')).toBeInTheDocument();
  });

  it('should render the modal for new thesauri', async () => {
    componentProps.type = 'thesaurus';
    render(componentProps);

    expect(await screen.findByText('Add thesaurus')).toBeInTheDocument();
  });

  it('should display an error if the field is empty when submitting', async () => {
    render(componentProps);
    const button = await screen.findByText('Save');
    fireEvent.click(button.parentElement!);

    expect(await screen.findByText('Required property')).toBeInTheDocument();
  });

  it('should call the cancel function when canceling', async () => {
    const cancelSpy = jest.fn();
    componentProps.cancelFunction = cancelSpy;
    render(componentProps);
    const button = await screen.findByText('Cancel');
    fireEvent.click(button.parentElement!);

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should call the acccept function when accepting', async () => {
    const saveSpy = jest.fn();
    componentProps.saveFunction = saveSpy;
    render(componentProps);

    await act(async () => {
      const button = await screen.findByText('Save');
      const input = await screen.findByRole('textbox');
      fireEvent.change(input, { target: { value: 'New relation type name' } });
      fireEvent.click(button.parentElement!);
    });

    expect(saveSpy).toHaveBeenCalledWith({ relationship: 'New relation type name' });
  });
});
