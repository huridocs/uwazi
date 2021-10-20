/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, RenderResult, screen, within } from '@testing-library/react';
import { actions } from 'react-redux-form';
import Immutable from 'immutable';

import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { SupportingFiles } from '../SupportingFiles';
import * as supportingLocalFilesActions from '../../actions/supportingFilesActions';

const entity1 = {
  _id: 'entity_id',
  sharedId: 'entity_sharedId',
  title: 'testTitle',
  metadata: [{ field1: 'field1value' }],
  attachments: [
    {
      _id: 'file1',
      originalname: 'file1.jpg',
      mimetype: 'image/jpeg',
      filename: '1634043075618nraarbdu2ko.jpg',
      size: 2305089,
      entity: 'entity_sharedId',
      type: 'attachment',
      creationDate: 1634043075634,
      __v: 0,
    },
    {
      _id: 'file2',
      originalname: 'file2.jpeg',
      mimetype: 'image/jpeg',
      filename: '16340430795962bgts67kme8.jpeg',
      size: 5287,
      entity: 'entity_sharedId',
      type: 'attachment',
      creationDate: 1634043079601,
      __v: 0,
    },
  ],
};

describe('Supporting files', () => {
  let reduxStore = {};
  let renderResult: RenderResult;

  const render = () => {
    reduxStore = {
      ...defaultState,
      library: {
        sidepanel: {
          metadata: entity1,
        },
      },
      attachments: {
        progress: Immutable.fromJS({}),
      },
    };
    ({ renderResult } = renderConnectedContainer(
      <SupportingFiles storeKey="library" model="library.sidepanel.metadata" />,
      () => reduxStore
    ));
  };

  describe('on edit', () => {
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
      const addSupportingFileButton = screen.getByText('Add supporting file').parentElement!;
      fireEvent.click(addSupportingFileButton);
      const selectFileButton = screen.getByText('Upload and select file');
      fireEvent.click(selectFileButton);
      const fileInput = screen.getByTestId('fileInput');
      const file = new File(['hello'], 'hello.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(supportingLocalFilesActions.uploadLocalAttachment).toHaveBeenCalled();
    });
  });
});
