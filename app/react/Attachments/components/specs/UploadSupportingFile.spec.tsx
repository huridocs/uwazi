/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { UploadSupportingFile } from '#app/Attachments/components/UploadSupportingFile.js';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.js';
import { MockStoreEnhanced } from 'redux-mock-store';

describe('UploadSupportingFile', () => {
  let store: MockStoreEnhanced;
  let reduxStore: {};

  function updateProgress(progressPercentage?: number) {
    return { attachments: { progress: Immutable.fromJS({ entity1: progressPercentage }) } };
  }
  function renderComponent() {
    reduxStore = { ...defaultState, ...updateProgress() };
    ({ store } = renderConnectedContainer(
      <UploadSupportingFile entitySharedId="entity1" storeKey="library" />,
      () => reduxStore
    ));
  }

  describe('AttachmentsModal opening by progress', () => {
    it('Should be closed by default', () => {
      renderComponent();
      const uploadFromComputerTab = screen.queryByText('Upload from computer');
      expect(uploadFromComputerTab).toBe(null);
    });

    it('Should be opened after "Add file" is clicked', () => {
      renderComponent();
      const addFileBtn: Element = screen.getByText('Add file').parentElement!;
      fireEvent.click(addFileBtn);
      const uploadFromComputerTab = screen.getByText('Upload from computer');
      expect(uploadFromComputerTab).not.toBeUndefined();
    });

    it('Should be closed when progress is equal to 100', async () => {
      renderComponent();
      const addFileBtn: Element = screen.getByText('Add file').parentElement!;
      fireEvent.click(addFileBtn);
      expect(screen.queryByText('Upload from computer')).not.toBe(null);

      reduxStore = { ...defaultState, ...updateProgress(100) };
      await waitFor(() => {
        store.dispatch({ type: 'test/progress' });
        expect(screen.queryByText('Upload from computer')).toBe(null);
      });
    });
  });
});
