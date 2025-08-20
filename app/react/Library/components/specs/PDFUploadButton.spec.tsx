/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import * as IDGenerator from 'shared/IDGenerator';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import * as uploadActions from 'app/Uploads/actions/uploadsActions';
import * as libraryActions from 'app/Library/actions/libraryActions';
import { TestAtomStoreProvider } from 'V2/testing';
import { templatesAtom } from 'V2/atoms';
import { PDFUploadButton } from '../PDFUploadButton';
import { template1, template2, template3 } from './fixtures/templates';

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
    spyOn(uploadActions, 'createDocument').and.returnValue(async () =>
      Promise.resolve({ sharedId: 'abc1' })
    );
    spyOn(uploadActions, 'uploadDocument').and.returnValue(async () => Promise.resolve());
    spyOn(libraryActions, 'unselectAllDocuments').and.returnValue(async () => Promise.resolve());
    spyOn(IDGenerator, 'generateID').and.returnValue('generatedID');
  });

  it('should upload all documents passed and unselect everything to close the sidebar', async () => {
    render();
    const fileInput = screen.getByLabelText('Upload PDF(s) to create');

    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files },
      });
    });

    expect(uploadActions.createDocument).toHaveBeenNthCalledWith(1, {
      title: 'File1 with some name',
    });
    expect(uploadActions.createDocument).toHaveBeenNthCalledWith(2, { title: 'File2 pdf' });
    expect(uploadActions.uploadDocument).toHaveBeenNthCalledWith(1, 'abc1', files[0]);
    expect(uploadActions.uploadDocument).toHaveBeenNthCalledWith(2, 'abc1', files[1]);
    expect(libraryActions.unselectAllDocuments).toHaveBeenCalledTimes(1);
  });

  it('should use generated id when applicable', async () => {
    render([template2, template3]);
    const fileInput = screen.getByLabelText('Upload PDF(s) to create');

    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files },
      });
    });

    expect(uploadActions.createDocument).toHaveBeenNthCalledWith(1, {
      title: 'generatedID',
    });
    expect(uploadActions.createDocument).toHaveBeenNthCalledWith(2, { title: 'generatedID' });
  });
});
