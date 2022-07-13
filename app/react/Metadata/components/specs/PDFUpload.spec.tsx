/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, RenderResult } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { PDFUpload } from '../PDFUpload';

describe('PDF upload', () => {
  const reduxStore = { library: { sidepanel: { metadata: {} } } };
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
});
