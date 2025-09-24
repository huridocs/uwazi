/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
// @ts-expect-error TS(2307): Cannot find module '../../Attachments/components/U... Remove this comment to see the full error message
import UploadSupportingFile from '../../Attachments/components/UploadSupportingFile.js';
import { Provider } from 'react-redux';
import { fireEvent, screen, RenderResult } from '@testing-library/react';
// @ts-expect-error TS(2307): Cannot find module '../../utils/test/renderConnect... Remove this comment to see the full error message
import { defaultState, renderConnectedContainer } from '../../utils/test/renderConnected.js';
import { MockStoreEnhanced } from 'redux-mock-store';

describe('UploadSupportingFile', () => {
  let renderResult: RenderResult;
  let store: MockStoreEnhanced;
  let reduxStore: {};

  function updateProgress(progressPercentage?: number) {
    return { attachments: { progress: Immutable.fromJS({ entity1: progressPercentage }) } };
  }
  function renderComponent() {
    reduxStore = { ...defaultState, ...updateProgress() };
    ({ renderResult, store } = renderConnectedContainer(
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

    it('Should be closed when progress is equal to 100', () => {
      renderComponent();
      const addFileBtn: Element = screen.getByText('Add file').parentElement!;
      fireEvent.click(addFileBtn);
      let uploadFromComputerTab = screen.queryByText('Upload from computer');
      expect(uploadFromComputerTab).not.toBe(null);

      reduxStore = { ...defaultState, ...updateProgress(100) };
      renderResult.rerender(
        <Provider store={store}>
          <UploadSupportingFile entitySharedId="entity1" storeKey="library" />
        </Provider>
      );

      uploadFromComputerTab = screen.queryByText('Upload from computer');
      expect(uploadFromComputerTab).toBe(null);
    });
  });
});
