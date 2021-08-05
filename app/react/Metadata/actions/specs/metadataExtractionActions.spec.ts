import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import { selectionHandler, formFieldUpdater } from '../metadataExtractionActions';

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
  });

  describe('selectionHandler', () => {
    it('should call updateIn with the selection parameters and the correct storeKey', () => {
      selectionHandler(
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
