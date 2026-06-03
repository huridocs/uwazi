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
    spyOn(uploadActions, 'uploadAndCreate').and.callFake((file: File, onProgress: any) => {
      if (onProgress) {
        onProgress(10, file.name);
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

    expect(uploadActions.uploadAndCreate).toHaveBeenCalledTimes(2);

    expect(uploadActions.uploadAndCreate).toHaveBeenCalledWith(files[0], expect.any(Function));
    expect(uploadActions.uploadAndCreate).toHaveBeenCalledWith(files[1], expect.any(Function));

    const { calls } = (uploadActions.uploadAndCreate as jest.Mock).mock;
    expect(calls[0][0].name).toBe(files[0].name);
    expect(calls[1][0].name).toBe(files[1].name);

    const inputEl = fileInput as HTMLInputElement;
    expect(inputEl.value).toBe('');
    expect(inputEl.files).toBeNull();
  });
});
