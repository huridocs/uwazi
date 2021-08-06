import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import {
  updateSelection,
  formFieldUpdater,
  getStoredSelections,
  saveSelections,
} from '../metadataExtractionActions';

describe('metadataExtractionActions', () => {
  beforeEach(() => {
    spyOn(formActions, 'change');
    spyOn(actions, 'updateIn');
  });

  describe('formFieldUpdater', () => {
    it('should update the form fields with the selected value', () => {
      formFieldUpdater('value to put in form', 'fieldModel');
      expect(formActions.change).toHaveBeenCalledWith('fieldModel', 'value to put in form');
    });

    it.each(['01/30/1999', '30/01/1999', '01-30-1999', '30-01-1999', '01 30 1999', '30 01 1999'])(
      'should format valid date inputs for Datepicker.js component',
      dateStrings => {
        const dateForDatepickerInUTC = 917654400;
        formFieldUpdater(dateStrings, 'fieldModel', 'date');
        expect(formActions.change).toHaveBeenCalledWith('fieldModel', dateForDatepickerInUTC);
      }
    );

    it('should parse dates that are only years, and set it to 01/01/YEAR', () => {
      const dateForDatepickerInUTC = 1609459200;
      formFieldUpdater('2021', 'fieldModel', 'date');
      expect(formActions.change).toHaveBeenCalledWith('fieldModel', dateForDatepickerInUTC);
    });
  });

  describe('updateSelection', () => {
    it('should call updateIn with the selection parameters and the correct storeKey', () => {
      updateSelection(
        { selectedText: 'text selected by the user on the file' },
        'aFieldLabel',
        'someFieldId'
      );
      expect(actions.updateIn).toHaveBeenLastCalledWith(
        'documentViewer.metadataExtraction',
        ['selections'],
        {
          _id: 'someFieldId',
          label: 'aFieldLabel',
          selection: { selectedText: 'text selected by the user on the file' },
          timestamp: Date(),
        }
      );
    });
  });

  describe('getStoredSelections', () => {
    it('should get extracted metadata selections stored in the file', () => {});
  });

  describe('saveSelections', () => {
    const data = {
      _id: 'abc123',
      label: 'Description of incident',
      timestamp: Date(),
      selection: [
        { text: 'a short description' },
        { selectionRectangle: [{ top: 10, left: 10, width: 100, height: 2, page: 3 }] },
      ],
    };
    it('should save the extracted selections into the file', async () => {
      await saveSelections(data, 'fileID');
    });
  });
});
