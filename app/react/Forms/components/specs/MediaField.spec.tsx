/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, RenderResult, act, fireEvent } from '@testing-library/react';
import MediaField from 'app/Forms/components/MediaField';
import { MediaModalType } from 'app/Metadata/components/MediaModal';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';

describe('MediaField', () => {
  let renderResult: RenderResult;

  const typeAttachment: 'attachment' | 'document' = 'attachment';
  const baseProps = {
    isOpen: false,
    onClose: () => jest.fn(),
    attachments: [],
    onChange: jest.fn(),
    selectedUrl: 'url',
    formModel: 'publicForm',
    multipleEdition: false,
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
      {
        _id: '',
        originalname: 'video.mp4',
        filename: 'video.mp4',
        serializedFile: 'data:video/mp4;base64,aGVsbG8=',
        type: typeAttachment,
        mimetype: 'video/mp4',
        entity: '6n7iqvz7p2s',
        fileLocalID: 'aoe2t67yrq',
      },
    ],
    name: '',
  };
  const imageProps = {
    value: 'uiea1s32zqg',
    formField: 'image',
    type: MediaModalType.Image,
    name: '',
  };

  const mediaProps = {
    value: 'aoe2t67yrq',
    formField: 'media',
    type: MediaModalType.Media,
    name: '',
  };

  const render = (otherProps = {}) => {
    ({ renderResult } = renderConnectedContainer(
      <MediaField
        formField=""
        type={MediaModalType.Image}
        value={null}
        {...{ ...baseProps, ...otherProps }}
      />,
      () => defaultState
    ));
  };

  describe('Object URL handling', () => {
    const mockedCreateObjectURL: jest.Mock = jest.fn();
    const mockedRevokeObjectURL: jest.Mock = jest.fn();

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
      const file = new File(['hello'], 'hello.png', { type: 'image/png' });
      render(imageProps);
      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.src).toEqual('blob:abc');
      expect(mockedCreateObjectURL).toHaveBeenCalledWith(file);
    });

    it('should revoke the created URL', async () => {
      render(imageProps);
      renderResult.unmount();
      expect(mockedRevokeObjectURL).toHaveBeenCalledWith('blob:abc');
    });

    it('should change the media value according with markdownmedia variations', async () => {
      render(mediaProps);

      await act(async () => {
        fireEvent.click(screen.getByText('Add timelink').parentElement!);
      });
      await act(async () => {
        const inputs = screen.getAllByRole('textbox');
        const hourInput = inputs.find(
          x => (x as HTMLInputElement).name === 'timelines.0.timeHours'
        )!;
        fireEvent.change(hourInput, {
          target: { value: '03' },
        });
        expect(baseProps.onChange).toHaveBeenLastCalledWith({
          data: '(aoe2t67yrq, {"timelinks":{"03:00:00":""}})',
          originalFile: baseProps.localAttachments[2],
        });
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Add timelink').parentElement!);
      });
      await act(async () => {
        const inputs = screen.getAllByRole('textbox');
        const hourInput = inputs.find(
          x => (x as HTMLInputElement).name === 'timelines.1.timeMinutes'
        )!;
        fireEvent.change(hourInput, {
          target: { value: '35' },
        });
        expect(baseProps.onChange).toHaveBeenLastCalledWith({
          data: '(aoe2t67yrq, {"timelinks":{"03:00:00":"","00:35:00":""}})',
          originalFile: baseProps.localAttachments[2],
        });
      });
      await act(async () => {
        fireEvent.click(screen.getAllByRole('button', { name: 'Remove timelink' })[0]);
        expect(baseProps.onChange).toHaveBeenLastCalledWith({
          data: '(aoe2t67yrq, {"timelinks":{"00:35:00":""}})',
          originalFile: baseProps.localAttachments[2],
        });
        fireEvent.click(screen.getAllByRole('button', { name: 'Remove timelink' })[0]);
        expect(baseProps.onChange).toHaveBeenLastCalledWith({
          data: '(aoe2t67yrq, {"timelinks":{}})',
          originalFile: baseProps.localAttachments[2],
        });
      });
    });

    it('should show and error if the image is not valid', async () => {
      render(imageProps);
      const img = renderResult.container.getElementsByTagName('img')[0];
      fireEvent.error(img);
      expect(
        await screen.findByText('This file type is not supported on media fields')
      ).toBeInTheDocument();
    });
  });
});
