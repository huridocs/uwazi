/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, RenderResult } from '@testing-library/react';
import MediaField from 'app/Forms/components/MediaField';
import { MediaModalType } from 'app/Metadata/components/MediaModal';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';

describe('MediaField', () => {
  const typeAttachment: 'attachment' | 'document' = 'attachment';
  const props = {
    isOpen: false,
    onClose: () => jest.fn(),
    attachments: [],
    onChange: (_id: any) => jest.fn(),
    selectedUrl: 'url',
    formModel: 'publicForm',
    formField: 'image',
    type: MediaModalType.Image,
    multipleEdition: false,
    value: 'uiea1s32zqg',
    localAttachments: [
      {
        _id: '624b6b139ef04f56db7ebff4',
        originalname: 'A.jpeg',
        mimetype: 'image/jpeg',
        size: 22215,
        filename: '164910977946345hasi59yxl.jpeg',
        entity: '6n7iqvz7p2s',
        type: typeAttachment,
        creationDate: 1649109779519,
      },
      {
        _id: '',
        originalname: 'D.jpeg',
        filename: 'D.jpeg',
        serializedFile: 'data:image/png;base64,aGVsbG8=',
        type: typeAttachment,
        mimetype: 'image/jpeg',
        entity: '6n7iqvz7p2s',
        fileLocalID: 'uiea1s32zqg',
      },
    ],
    name: '',
  };

  describe('Object URL handling', () => {
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    const mockedCreateObjectURL: jest.Mock = jest.fn();
    const mockedRevokeObjectURL: jest.Mock = jest.fn();
    let renderResult: RenderResult;

    const render = (otherProps = {}) => {
      ({ renderResult } = renderConnectedContainer(
        <MediaField {...{ ...props, ...otherProps }} />,
        () => defaultState
      ));
    };
    beforeAll(() => {
      URL.createObjectURL = mockedCreateObjectURL;
      mockedCreateObjectURL.mockReturnValue('blob:abc');
      URL.revokeObjectURL = mockedRevokeObjectURL;
    });

    afterAll(() => {
      mockedCreateObjectURL.mockReset();
      mockedRevokeObjectURL.mockReset();
    });

    it('should create an object URL with the file', async () => {
      render();
      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.src).toEqual('blob:abc');
      expect(mockedCreateObjectURL).toHaveBeenCalledWith(file);
    });

    it('should revoke the created URL', async () => {
      render();
      renderResult.unmount();
      expect(mockedRevokeObjectURL).toHaveBeenCalledWith('blob:abc');
    });
  });
});
