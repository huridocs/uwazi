/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fromJS } from 'immutable';
import { fireEvent, screen, RenderResult } from '@testing-library/react';
import { actions as formActions } from 'react-redux-form';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { UserRole } from 'shared/types/userSchema';
import { PDFUpload } from '../PDFUpload';

describe('PDF upload', () => {
  const reduxStore = {
    library: {
      sidepanel: {
        metadata: {
          documents: [
            {
              _id: 'file1',
              filename: '1657737319513hr3c3v5nnm.pdf',
              mimetype: 'application/pdf',
              status: 'ready',
              language: 'other',
              type: 'document',
              originalname: 'Previously saved file.pdf',
            },
          ],
        },
      },
    },
    user: fromJS({
      email: 'editor1@relation.test',
      username: 'editor 1',
      _id: 'editor1',
      role: UserRole.EDITOR,
    }),
  };

  let renderResult: RenderResult;
  const mockedCreateObjectURL: jest.Mock = jest.fn();

  const render = () => {
    const store = { ...defaultState, ...reduxStore };
    ({ renderResult } = renderConnectedContainer(
      <PDFUpload model="library.sidepanel.metadata" />,
      () => store
    ));
  };

  beforeAll(() => {
    URL.createObjectURL = mockedCreateObjectURL;
    mockedCreateObjectURL.mockReturnValue('blob:abc');
  });

  afterAll(() => {
    mockedCreateObjectURL.mockReset();
  });

  it('Should upload main documents', () => {
    const newFiles = [
      new File([Buffer.from('pdf').toString('base64')], 'file1.pdf', {
        type: 'application/pdf',
      }),
      new File([Buffer.from('pdf').toString('base64')], 'file2.pdf', {
        type: 'application/pdf',
      }),
    ];

    render();
    const fileInput = renderResult.container.querySelector('input[type="file"]') as HTMLElement;
    fireEvent.change(fileInput, {
      target: {
        files: [newFiles],
      },
    });

    expect(mockedCreateObjectURL).toHaveBeenCalledWith(newFiles);
  });

  it('should list the existing documents and allow removing them', async () => {
    spyOn(formActions, 'remove').and.callFake(form => ({ type: 'ACTION-TYPE', value: form }));

    render();

    const fileNameInput = (await screen.getByRole('textbox')) as HTMLInputElement;

    expect(fileNameInput.getAttribute('name')).toEqual('.documents.0.originalname');

    const deleteButton = (await screen.getByRole('button', {
      name: 'Delete file',
    })) as HTMLButtonElement;

    fireEvent.click(deleteButton);

    expect(formActions.remove).toHaveBeenCalledWith('library.sidepanel.metadata.documents', 0);
  });
});
