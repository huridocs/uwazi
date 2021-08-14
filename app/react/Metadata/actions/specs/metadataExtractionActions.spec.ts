import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import { updateSelection, formFieldUpdater } from '../metadataExtractionActions';

describe('metadataExtractionActions', () => {
  describe('formFieldUpdater', () => {
    beforeEach(() => {
      spyOn(formActions, 'change');
    });

    it('should update the form fields with the selected value', () => {
      formFieldUpdater('value to put in form', 'fieldModel');
      expect(formActions.change).toHaveBeenCalledWith('fieldModel', 'value to put in form');
    });

    it.each(['01/30/1999', '30/01/1999', '01-30-1999', '01 30 1999', '30 01 1999'])(
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

    describe('numeric fields', () => {
      it('should check that selections for numeric fields are actual numbers', () => {
        formFieldUpdater('12345', 'fieldModel', 'numeric');
        expect(formActions.change).toHaveBeenCalledWith('fieldModel', '12345');
      });
      it('should set the numeric field to 0 if the value is not a number', () => {
        formFieldUpdater('une two three', 'fieldModel', 'numeric');
        expect(formActions.change).toHaveBeenCalledWith('fieldModel', '0');
      });
    });
  });

  describe('updateSelection', () => {
    beforeEach(() => {
      spyOn(actions, 'updateIn');
    });

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
});
