/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
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

  jest.spyOn(ocrActions, 'dummyOCRServiceCall');

  beforeEach(() => {
    file = { ocrstatus: 'noOCR' };
  });

  const render = (store: Partial<IStore>, pdf: FileType) => {
    reduxStore = { ...defaultState, ...store };
    renderConnectedContainer(<OCRButton file={pdf} />, () => reduxStore);
  };

  describe('rendering', () => {
    it('should render if the OCR feature is enabled', () => {
      //Using dummy feature settings
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
      file = { ocrstatus: 'withOCR' };
      render(reduxStore, file);
      expect(screen.getByText('OCR Complete')).not.toBeNull();
    });

    it('should trigger the OCR service when clicking the add to ocr queue button', () => {
      render(reduxStore, { ...file, _id: 'fileId' });
      screen.getByRole('button').click();
      expect(ocrActions.dummyOCRServiceCall).toHaveBeenCalledWith({ ...file, _id: 'fileId' });
    });
  });
});
