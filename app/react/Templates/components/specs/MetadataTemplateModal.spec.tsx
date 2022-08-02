/**
 * @jest-environment jsdom
 */
import React from 'react';
import { RenderResult } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { MetadataTemplateModal, MetadataTemplateModalProps } from '../MetadataTemplateModal';

describe('Metadata template modal', () => {
  let renderResult: RenderResult;
  let componentProps: MetadataTemplateModalProps;
  const reduxStore = {};

  const render = ({ isOpen, type, cancelAction, saveAction }: MetadataTemplateModalProps) => {
    const store = { ...defaultState, ...reduxStore };
    ({ renderResult } = renderConnectedContainer(
      <MetadataTemplateModal
        isOpen={isOpen}
        type={type}
        cancelAction={cancelAction}
        saveAction={saveAction}
      />,
      () => store
    ));
  };

  beforeEach(() => {
    componentProps = {
      isOpen: true,
      type: 'relationship',
      saveAction: () => {},
      cancelAction: () => {},
    };
  });

  it('should render the modal for new relation types', async () => {
    render(componentProps);
    expect(await renderResult.findByText('Add relation type')).toBeInTheDocument();
  });

  it('should render the modal for new thesauri', async () => {
    componentProps.type = 'thesaurus';
    render(componentProps);
    expect(await renderResult.findByText('Add thesaurus')).toBeInTheDocument();
  });
});
