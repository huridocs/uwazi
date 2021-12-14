/**
 * @jest-environment jest-environment-jsdom-sixteen
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import Immutable from 'immutable';
import { FileType } from 'shared/types/fileType';
import { IStore } from 'app/istore';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import { OCRDisplay } from '../OCRDisplay';
import * as ocrActions from '../../actions/ocrActions';

describe('OCRDisplay', () => {
  let file: FileType;
  let store: any;

  jest.spyOn(ocrActions, 'postToOcr');
  jest.spyOn(ocrActions, 'getOcrStatus').mockImplementation(async filename =>
    Promise.resolve({
      status: filename,
      lastUpdated: 1000,
    })
  );

  beforeEach(() => {
    jest.clearAllMocks();
    file = { _id: 'file_id', filename: 'noOCR' };
    store = { ...defaultState };
  });

  const render = (toggleOCRButton: boolean, pdf: FileType) => {
    const reduxStore = {
      ...store,
      settings: {
        collection: Immutable.fromJS({ toggleOCRButton }),
      },
    };
    renderConnectedContainer(<OCRDisplay file={pdf} />, () => reduxStore);
  };

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

    it('should take localization for the last update date format', async () => {
      file = { filename: 'inQueue' };
      store.locale = 'es';
      render(true, file);
      expect(
        await screen.findByText(`Last updated: ${new Date(1000).toLocaleString('es')}`)
      ).not.toBeNull();
    });

    it('should render a button if the file has no OCR', async () => {
      render(true, file);
      expect((await screen.findByRole('button')).textContent).toBe('Add to OCR queue');
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
  });

  it('should not try to get the status if the feature is not toggled on', async () => {
    render(false, file);
    expect(ocrActions.getOcrStatus).not.toHaveBeenCalled();
  });
});
