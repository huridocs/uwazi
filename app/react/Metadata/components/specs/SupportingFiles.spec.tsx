/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, RenderResult, screen, within } from '@testing-library/react';
import { actions } from 'react-redux-form';
import Immutable from 'immutable';

import { ClientFile } from 'app/istore';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { SupportingFiles } from '../SupportingFiles';
import * as supportingLocalFilesActions from '../../actions/supportingFilesActions';

describe('Supporting files', () => {
  let reduxStore = {};
  let renderResult: RenderResult;
  let attachments: Array<ClientFile & { serializedFile?: string }> = [];
  const entity1 = {
    _id: 'entity_id',
    sharedId: 'entity_sharedId',
    title: 'testTitle',
    metadata: { field1: [{ label: 'field1', value: 'things' }] },
    attachments,
  };

  const render = () => {
    reduxStore = {
      ...defaultState,
      attachments: {
        progress: Immutable.fromJS({}),
      },
    };
    ({ renderResult } = renderConnectedContainer(
      <SupportingFiles
        supportingFiles={entity1.attachments}
        entitySharedID={entity1.sharedId}
        model="library.sidepanel.metadata"
      />,
      () => reduxStore
    ));
  };

  describe('render', () => {
    beforeAll(() => {
      attachments = [
        {
          _id: 'file1',
          originalname: 'file1.jpg',
          filename: 'file1.jpg',
          mimetype: 'image/jpeg',
          entity: 'entity_sharedId',
        },
        {
          _id: 'file2',
          originalname: 'file2.pdf',
          filename: 'file2.pdf',
          mimetype: 'image/jpeg',
          entity: 'entity_sharedId',
        },
        {
          _id: 'file3',
          filename: 'file3',
          serializedFile: 'serializedBinary',
          entity: 'entity_sharedId',
        },
      ];
      entity1.attachments = attachments;
    });

    it('should display the image file for image supporting files', () => {
      render();
      const imageFile = screen.getByRole('img');
      expect(imageFile.getAttribute('src')).toEqual('/api/files/file1.jpg');
    });

    it('should display an icon for pdfs', () => {
      render();
      const pdfFileIcon = screen.getByText('pdf');
      expect(pdfFileIcon.firstChild?.nodeName).toBe('svg');
    });

    it('should display an icon for files with serialized info', () => {
      render();
      const pdfFileIcon = screen.getByText('file');
      expect(pdfFileIcon.firstChild?.nodeName).toBe('svg');
    });
  });

  describe('on edit', () => {
    beforeAll(() => {
      attachments = [
        {
          _id: 'file1',
          originalname: 'file1.jpg',
          filename: 'file1.jpg',
          mimetype: 'image/jpeg',
          entity: 'entity_sharedId',
        },
        {
          _id: 'file2',
          originalname: 'file2.jpeg',
          filename: 'file2.jpg',
          mimetype: 'image/jpeg',
          entity: 'entity_sharedId',
        },
      ];
      entity1.attachments = attachments;
    });

    beforeEach(() => {
      spyOn(actions, 'remove').and.returnValue({ type: 'deleting' });
      spyOn(supportingLocalFilesActions, 'uploadLocalAttachment').and.returnValue({
        type: 'adding to local form',
      });
    });

    it('should display existing supporting files when editing on the sidepanel', () => {
      render();
      const files = screen.queryAllByAltText(/file/);
      expect(files).toHaveLength(2);
    });

    it('should allow deleting supporting files', () => {
      render();
      const attachmentList = renderResult.container.querySelector(
        '.attachments-list'
      ) as HTMLElement;
      const removeFile2button = within(attachmentList).getAllByRole('button')[1];
      fireEvent.click(removeFile2button);
      expect(actions.remove).toHaveBeenCalledWith('library.sidepanel.metadata.attachments', 1);
    });

    it('should allow adding new supporting files', () => {
      render();
      const addSupportingFileButton = screen.getByText('Add file').parentElement!;
      fireEvent.click(addSupportingFileButton);
      const selectFileButton = screen.getByText('Upload and select file');
      fireEvent.click(selectFileButton);
      const fileInput = screen.getByLabelText('fileInput');
      const file = new File(['hello'], 'hello.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(supportingLocalFilesActions.uploadLocalAttachment).toHaveBeenCalled();
    });
  });
});
