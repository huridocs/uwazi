/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import Immutable from 'immutable';
import { IStore } from 'app/istore';
import { FileType } from 'shared/types/fileType';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { OCRButton } from '../OCRButton';
import * as ocrActions from '../../actions/ocrActions';

describe('OCRButton', () => {
  let reduxStore: Partial<IStore> = {
    settings: { collection: Immutable.fromJS({ features: { ocrtrigger: true } }) },
  };

  let file: FileType;

  jest.spyOn(ocrActions, 'dummyOCRPost');

  beforeEach(() => {
    file = { filename: 'noOCR' };
  });

  const render = (store: Partial<IStore>, pdf: FileType) => {
    reduxStore = { ...defaultState, ...store };
    renderConnectedContainer(<OCRButton file={pdf} />, () => reduxStore);
  };

  describe('rendering', () => {
    it('should render if the OCR feature is enabled', () => {
      render(reduxStore, {});
      expect(screen.getByText('Add to OCR queue')).not.toBeNull();
    });
  });

  describe('status', () => {
    it('should render a button if the file has no OCR', () => {
      render(reduxStore, file);
      expect(screen.getByRole('button').textContent).toBe('Add to OCR queue');
    });

    it('should render according to the pdf OCR status', () => {
      file = { filename: 'withOCR' };
      render(reduxStore, file);
      expect(screen.getByText('OCR Complete')).not.toBeNull();
    });

    describe('adding to ocr queue', () => {
      it('should trigger the OCR service when clicking the button', () => {
        render(reduxStore, { ...file, _id: 'fileId' });
        const ocrButton: Element = screen.getByRole('button');
        fireEvent.click(ocrButton);
        expect(ocrActions.dummyOCRPost).toHaveBeenCalledWith({ ...file, _id: 'fileId' });
      });

      it('should change to show the file is in the queue', () => {
        render(reduxStore, file);
        const ocrButton: Element = screen.getByRole('button');
        fireEvent.click(ocrButton);
        expect(screen.getByText('In OCR queue')).not.toBeNull();
      });
    });
  });
});
