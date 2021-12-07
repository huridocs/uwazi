/**
 * @jest-environment jest-environment-jsdom-sixteen
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import Immutable from 'immutable';
import { FileType } from 'shared/types/fileType';
import { IStore } from 'app/istore';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import { OCRButton } from '../OCRButton';
import * as ocrActions from '../../actions/ocrActions';

describe('OCRButton', () => {
  let file: FileType;

  let reduxStore: Partial<IStore> = {
    settings: {
      collection: Immutable.fromJS({ toggleOCRButton: true }),
    },
  };

  jest.spyOn(ocrActions, 'dummyOCRPost');

  beforeEach(() => {
    file = { filename: 'noOCR' };
  });

  const render = (store: Partial<IStore>, pdf: FileType) => {
    reduxStore = { ...defaultState, ...store };
    renderConnectedContainer(<OCRButton file={pdf} />, () => reduxStore);
  };

  describe('rendering', () => {
    it('should first render with a loading OCR message', async () => {
      render(reduxStore, file);
      expect(await screen.findByText('Loading')).not.toBeNull();
    });
  });

  describe('status', () => {
    it('should render according to the pdf OCR status', async () => {
      file = { filename: 'withOCR' };

      render(reduxStore, file);

      expect(await screen.findByText('OCR Complete')).not.toBeNull();
    });

    it('should render a button if the file has no OCR', async () => {
      render(reduxStore, file);
      expect((await screen.findByRole('button')).textContent).toBe('Add to OCR queue');
    });

    describe('adding to ocr queue', () => {
      it('should trigger the OCR service when clicking the button', async () => {
        render(reduxStore, { ...file, _id: 'fileId' });
        const ocrButton: Element = await screen.findByRole('button');
        fireEvent.click(ocrButton);
        expect(ocrActions.dummyOCRPost).toHaveBeenCalledWith({ ...file, _id: 'fileId' });
      });

      it('should change to show the file is in the queue', async () => {
        render(reduxStore, file);
        const ocrButton: Element = await screen.findByRole('button');
        fireEvent.click(ocrButton);
        expect(await screen.findByText('In OCR queue')).not.toBeNull();
      });
    });
  });
});
