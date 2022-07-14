/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fromJS } from 'immutable';
import { fireEvent, screen, RenderResult } from '@testing-library/react';
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

  it('Should upload a main document', () => {
    const newFile = new File([Buffer.from('pdf').toString('base64')], 'file.pdf', {
      type: 'application/pdf',
    });
    render();
    const fileInput = renderResult.container.querySelector('input[type="file"]') as HTMLElement;
    fireEvent.change(fileInput, {
      target: {
        files: [newFile],
      },
    });
    expect(mockedCreateObjectURL).toHaveBeenCalledWith(newFile);
  });

  it('should list the existing documents', () => {
    render();
    const listFile = screen.queryByText('Previously saved file.pdf');
    expect(listFile).toBeInTheDocument();
  });
});
