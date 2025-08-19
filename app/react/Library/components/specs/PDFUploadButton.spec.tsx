/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import * as uploadActions from 'app/Uploads/actions/uploadsActions';
import * as libraryActions from 'app/Library/actions/libraryActions';
import { PDFUploadButton } from '../PDFUploadButton';

describe('PDFUploadButton', () => {
  const files = [new File([], 'file1 with some name.pdf'), new File([], 'file2-pdf.pdf')];

  const render = () => renderConnectedContainer(<PDFUploadButton />, () => defaultState);

  beforeEach(() => {
    spyOn(uploadActions, 'createDocument').and.returnValue(async () =>
      Promise.resolve({ sharedId: 'abc1' })
    );
    spyOn(uploadActions, 'uploadDocument').and.returnValue(async () => Promise.resolve());
    spyOn(libraryActions, 'unselectAllDocuments').and.returnValue(async () => Promise.resolve());
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
    expect(uploadActions.uploadDocument).toHaveBeenCalledWith('abc1', files[0]);
    expect(uploadActions.uploadDocument).toHaveBeenCalledWith('abc1', files[1]);
    expect(libraryActions.unselectAllDocuments).toHaveBeenCalledTimes(1);
  });
});
