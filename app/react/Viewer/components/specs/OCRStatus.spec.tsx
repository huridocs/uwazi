/**
 * @jest-environment jest-environment-jsdom
 */
import React from 'react';
import { fireEvent, RenderResult, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Immutable from 'immutable';
import { FileType } from 'shared/types/fileType';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import { socket } from 'app/socket';
import { Provider } from 'react-redux';
import { OCRStatus } from '../OCRStatus';
import * as ocrActions from '../../actions/ocrActions';
import * as documentActions from '../../actions/documentActions';

describe('OCRStatus', () => {
  let file: FileType;
  let store: any;
  let renderResult: RenderResult;
  let configuredStore: any;

  const mockSocketOn: any = {};

  jest.spyOn(socket, 'on').mockImplementation((event: string, callback: any) => {
    mockSocketOn[event] = callback;
  });
  jest.spyOn(socket, 'off').mockImplementation((event: string, callback: any) => {
    mockSocketOn[event] = callback;
  });

  jest.spyOn(documentActions, 'reloadDocument').mockReturnValue(async () => Promise.resolve());

  jest.spyOn(ocrActions, 'postToOcr').mockResolvedValue();
  jest.spyOn(ocrActions, 'getOcrStatus').mockImplementation(async filename =>
    Promise.resolve({
      status: filename,
      lastUpdated: 1000,
    })
  );

  beforeEach(() => {
    jest.clearAllMocks();
    file = { _id: 'file_id', filename: 'noOCR', entity: 'entitySharedId' };
    store = { ...defaultState };
  });

  const render = (ocrServiceEnabled: boolean, pdf: FileType) => {
    const reduxStore = {
      ...store,
      settings: {
        collection: Immutable.fromJS({ ocrServiceEnabled }),
      },
    };
    ({ renderResult, store: configuredStore } = renderConnectedContainer(
      <OCRStatus file={pdf} />,
      () => reduxStore
    ));
  };

  it('should not try to get the status if the feature is not toggled on', async () => {
    render(false, file);
    expect(ocrActions.getOcrStatus).not.toHaveBeenCalled();
  });

  describe('rendering', () => {
    it('should first render with a loading OCR message', async () => {
      render(true, file);
      expect(await screen.findByText('Loading')).not.toBeNull();
    });
  });

  describe('status', () => {
    it('should render according to the pdf OCR status', async () => {
      file = { filename: 'withOCR' };
      render(true, file);
      expect(await screen.findByText('OCR')).not.toBeNull();
    });

    it('should render the date with the last update', async () => {
      file = { filename: 'inQueue' };
      render(true, file);
      expect(
        await screen.findByText(`Last updated: ${new Date(1000).toLocaleString('en')}`)
      ).not.toBeNull();
    });

    it('should have localization for the last update date format', async () => {
      file = { filename: 'inQueue' };
      store.locale = 'es';
      render(true, file);
      expect(
        await screen.findByText(`Last updated: ${new Date(1000).toLocaleString('es')}`)
      ).not.toBeNull();
    });

    it('should render a button if the file has no OCR', async () => {
      render(true, file);
      expect((await screen.findByRole('button')).textContent).toBe('OCR PDF');
    });

    describe('adding to ocr queue', () => {
      it('should trigger the OCR service when clicking the button', async () => {
        render(true, file);
        const ocrButton: Element = await screen.findByRole('button');
        fireEvent.click(ocrButton);
        expect(ocrActions.postToOcr).toHaveBeenCalledWith(file.filename);
      });

      it('should change to show the file is in the queue inmediatly', async () => {
        render(true, file);
        const ocrButton: Element = await screen.findByRole('button');
        fireEvent.click(ocrButton);
        expect(await screen.findByText('In OCR queue')).not.toBeNull();
      });
    });

    describe('when language is not supported', () => {
      beforeEach(() => {
        jest.spyOn(ocrActions, 'getOcrStatus').mockImplementationOnce(async _filename =>
          Promise.resolve({
            status: 'unsupported_language',
            lastUpdated: undefined,
          })
        );
      });

      it('should show a language not supported message', async () => {
        render(true, { ...file, language: 'other' });
        expect(await screen.findByText('Unsupported OCR language')).not.toBeNull();
      });

      it('should re-request the status if the file changes', async () => {
        render(true, { ...file, language: 'other' });
        expect(await screen.findByText('Unsupported OCR language')).not.toBeNull();
        jest.spyOn(ocrActions, 'getOcrStatus').mockImplementationOnce(async _filename =>
          Promise.resolve({
            status: 'noOCR',
            lastUpdated: undefined,
          })
        );
        renderResult.rerender(
          <Provider store={configuredStore}>
            <OCRStatus file={{ ...file, language: 'eng' }} />
          </Provider>
        );
        expect(await screen.findByText('OCR PDF')).not.toBeNull();
      });
    });
  });

  describe('sockets', () => {
    const renderAndSubmit = async () => {
      render(true, file);
      const ocrButton: Element = await screen.findByRole('button');
      fireEvent.click(ocrButton);

      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 0);
      });
    };

    it('should listen for the ocr service on submit', async () => {
      await renderAndSubmit();
      expect(socket.on).toHaveBeenCalled();
    });

    it('should change to display that the ocr is done when the service reports ready, and call to replace the file', async () => {
      await renderAndSubmit();
      await act(() => {
        mockSocketOn['ocr:ready']('file_id');
      });
      expect(await screen.findByText('OCR completed')).not.toBeNull();
      expect(documentActions.reloadDocument).toHaveBeenCalledWith('entitySharedId');
    });

    it('should change to display that the ocr has failed when the service reports error', async () => {
      await renderAndSubmit();
      await act(() => {
        mockSocketOn['ocr:error']('file_id');
      });
      expect(await screen.findByText('Could not be processed')).not.toBeNull();
    });

    it('should listen to the ocr service if the document is in the ocr queue when the component loads', async () => {
      render(true, { ...file, filename: 'inQueue' });
      expect(await screen.findByText('In OCR queue')).not.toBeNull();
      expect(socket.on).toHaveBeenCalled();
    });

    it('should ignore service reports for other files', async () => {
      await renderAndSubmit();
      await act(() => {
        mockSocketOn['ocr:ready']('another_file_id');
      });
      expect(await screen.findByText('In OCR queue')).not.toBeNull();
      expect(documentActions.reloadDocument).not.toHaveBeenCalled();
    });

    it('should unsubscribe from socket event when unmounting the component', async () => {
      render(true, file);
      expect((await screen.findByRole('button')).textContent).toBe('OCR PDF');
      renderResult.unmount();
      expect(socket.off).toHaveBeenCalled();
    });
  });
});
