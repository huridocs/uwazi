/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderConnectedContainer, defaultState } from '#app/utils/test/renderConnected.js';
import * as uploadActions from '#app/Uploads/actions/uploadsActions.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { PDFUploadButton } from '../PDFUploadButton.js';
import { template1, template2 } from './fixtures/templates.js';

describe('PDFUploadButton', () => {
  const files = [new File([], 'file1 with some name.pdf'), new File([], 'file2-pdf.pdf')];

  const render = (templates = [template1, template2]) =>
    renderConnectedContainer(
      <TestAtomStoreProvider initialValues={[[templatesAtom, templates]]}>
        <PDFUploadButton />
      </TestAtomStoreProvider>,
      () => defaultState
    );

  beforeEach(() => {
    spyOn(uploadActions, 'uploadAndCreate').and.callFake((batch: File[], onProgress: any) => {
      if (onProgress && batch[0]) {
        onProgress(10, batch[0].name);
      }
      return async () => Promise.resolve({ sharedId: 'abc1' });
    });
  });

  it('should trigger the upload process', async () => {
    render();
    const fileInput = screen.getByLabelText('Upload PDF(s) to create');

    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files },
      });
    });

    expect(uploadActions.uploadAndCreate).toHaveBeenCalledTimes(1);

    expect(uploadActions.uploadAndCreate).toHaveBeenCalledWith(
      files,
      expect.any(Function),
      expect.any(Function)
    );

    const { calls } = (uploadActions.uploadAndCreate as jest.Mock).mock;
    expect(calls[0][0][0].name).toBe(files[0].name);
    expect(calls[0][0][1].name).toBe(files[1].name);

    const inputEl = fileInput as HTMLInputElement;
    expect(inputEl.value).toBe('');
  });
});
