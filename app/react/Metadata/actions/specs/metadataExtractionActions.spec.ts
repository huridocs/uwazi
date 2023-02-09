import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { IImmutable } from 'shared/types/Immutable';
import api from 'app/Entities/EntitiesAPI';
import { ClientFile } from 'app/istore';
import { updateSelection, updateFormField, deleteSelection } from '../metadataExtractionActions';

describe('metadataExtractionActions', () => {
  describe('updateFormField', () => {
    beforeEach(() => {
      spyOn(formActions, 'change');
    });

    it('should update the form fields with the selected value', async () => {
      const value = 'value to put in form';
      spyOn(api, 'coerceValue').and.returnValue(Promise.resolve({ value, success: true }));
      await updateFormField(value, 'fieldModel');
      expect(formActions.change).toHaveBeenCalledWith('fieldModel', value);
    });

    it.each(['01/30/1999', '30/01/1999', '01-30-1999', '01 30 1999', '30 01 1999'])(
      'should format valid date inputs for Datepicker.js component',
      async dateStrings => {
        const dateForDatepickerInUTC = 917654400;
        spyOn(api, 'coerceValue').and.returnValue(
          Promise.resolve({ value: dateForDatepickerInUTC, success: true })
        );
        await updateFormField(dateStrings, 'fieldModel', 'date');
        expect(formActions.change).toHaveBeenCalledWith('fieldModel', dateForDatepickerInUTC);
      }
    );

    it('should parse dates that are only years, and set it to 01/01/YEAR', async () => {
      const dateForDatepickerInUTC = 1609459200;
      spyOn(api, 'coerceValue').and.returnValue(
        Promise.resolve({ value: dateForDatepickerInUTC, success: true })
      );

      await updateFormField('2021', 'fieldModel', 'date');
      expect(formActions.change).toHaveBeenCalledWith('fieldModel', dateForDatepickerInUTC);
    });

    describe('numeric fields', () => {
      it('should check that selections for numeric fields are actual numbers', async () => {
        spyOn(api, 'coerceValue').and.returnValue(Promise.resolve({ value: 12345, success: true }));
        await updateFormField('12345', 'fieldModel', 'numeric');
        expect(formActions.change).toHaveBeenCalledWith('fieldModel', 12345);
      });
    });
  });

  describe('updateSelection', () => {
    beforeEach(() => {
      spyOn(actions, 'updateIn');
    });

    it('should call updateIn with the selection parameters and the correct storeKey', () => {
      updateSelection(
        { text: 'text selected by the user on the file', selectionRectangles: [] },
        'fieldName',
        'someFieldId'
      );
      expect(actions.updateIn).toHaveBeenLastCalledWith(
        'documentViewer.metadataExtraction',
        ['selections'],
        {
          propertyID: 'someFieldId',
          name: 'fieldName',
          selection: { text: 'text selected by the user on the file', selectionRectangles: [] },
          timestamp: Date(),
        },
        'propertyID'
      );
    });
  });

  describe('delete selections', () => {
    const middlewares = [thunk];
    const mockStore = configureMockStore(middlewares);
    const store = mockStore();

    let entityDocument: IImmutable<ClientFile>;

    beforeEach(() => {
      entityDocument = Immutable.fromJS({
        _id: 'fileId',
        extractedMetadata: [
          {
            name: 'title',
            selection: {},
          },
          {
            name: 'property',
            propertyID: '1',
            selection: {},
          },
        ],
      });
      spyOn(actions, 'setIn').and.returnValue({ type: 'SET_IN' });
      spyOn(actions, 'updateIn').and.returnValue({ type: 'UPDATE_IN' });
    });

    it('should mark the property to be deleted and remove it from the file', () => {
      deleteSelection(entityDocument, 'title')(store.dispatch);

      expect(actions.setIn).toHaveBeenCalledWith('viewer/doc', 'defaultDoc', {
        _id: 'fileId',
        extractedMetadata: [{ name: 'property', propertyID: '1', selection: {} }],
      });

      expect(actions.updateIn).toHaveBeenCalledWith(
        'documentViewer.metadataExtraction',
        ['selections'],
        {
          deleteSelection: true,
          name: 'title',
          selection: { selectionRectangles: [], text: '' },
        },
        'propertyID'
      );
    });
  });
});
