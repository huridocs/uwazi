import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';
import { actions as formActions } from 'react-redux-form';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { updateSelection, formFieldUpdater, saveSelections } from '../metadataExtractionActions';

describe('metadataExtractionActions', () => {
  beforeAll(() => {
    spyOn(formActions, 'change');
    spyOn(actions, 'updateIn');
    spyOn(api, 'post').and.returnValue(Response);
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

  describe('saveSelections', () => {
    //WIP
    const entity: EntityWithFilesSchema = { sharedId: 'myEntity' };
    const file: FileType = { _id: 'fileID', entity: 'myEntity', extractedMetadata: [] };

    it('should save selected data to the main file on document save', async () => {
      await saveSelections(entity);
    });
  });
});
