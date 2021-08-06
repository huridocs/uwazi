import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import { updateSelection, formFieldUpdater } from '../metadataExtractionActions';

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
        const dateForDatepickerInUTC = 917665200;
        formFieldUpdater(dateStrings, 'fieldModel', 'date');
        expect(formActions.change).toHaveBeenCalledWith('fieldModel', dateForDatepickerInUTC);
      }
    );

    it('should parse dates that are only years, and set it to 01/01/YEAR', () => {
      const dateForDatepickerInUTC = 1609470000;
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
});
