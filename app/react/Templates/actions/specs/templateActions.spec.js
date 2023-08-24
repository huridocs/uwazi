import { actions as formActions } from 'react-redux-form';
import Immutable from 'immutable';
import thunk from 'redux-thunk';
import { RequestParams } from 'app/utils/RequestParams';
import { I18NApi } from 'app/I18N';
import { APIURL } from 'app/config.js';
import { mockID } from 'shared/uniqueID';
import * as actions from 'app/Templates/actions/templateActions';
import backend from 'fetch-mock';
import configureMockStore from 'redux-mock-store';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import * as types from 'app/Templates/actions/actionTypes';
import api from 'app/Templates/TemplatesAPI';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('templateActions', () => {
  let dispatch;
  let getState;
  let formModel;
  beforeEach(() => {
    jest.resetAllMocks();
    mockID();
    formModel = {
      thesauris: Immutable.fromJS([{ _id: 'first_thesauri_id' }, { _id: 2 }]),
      template: {
        data: {
          properties: [{ name: 'property1' }, { name: 'property2' }],
          entityViewPage: 'old value',
        },
      },
    };
    dispatch = jasmine.createSpy('dispatch');
    getState = jasmine.createSpy('getState').and.returnValue(formModel);
    spyOn(formActions, 'change');
    spyOn(formActions, 'load');
    spyOn(formActions, 'move');
    spyOn(formActions, 'remove');
    spyOn(formActions, 'reset');
    spyOn(formActions, 'resetErrors');
    jest.spyOn(I18NApi, 'get').mockImplementation(async () => Promise.resolve([]));
  });

  describe('updateValue', () => {
    it('should update the model with the provided value', () => {
      actions.updateValue('.entityViewPage', 'newPage')(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('template.data.entityViewPage', 'newPage');
    });
  });

  describe('addProperty()', () => {
    it('should add the property to the form data with a unique id in the index provided', () => {
      actions.addProperty({ name: 'property3' }, 0)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('template.data.properties', [
        { name: 'property3', localID: 'unique_id' },
        { name: 'property1' },
        { name: 'property2' },
      ]);
    });

    describe('when property is a select or multiselect', () => {
      it('should should add as first thesauri as default value', () => {
        actions.addProperty({ name: 'property3', type: 'select' }, 0)(dispatch, getState);
        expect(formActions.change).toHaveBeenCalledWith('template.data.properties', [
          { name: 'property3', type: 'select', localID: 'unique_id', content: 'first_thesauri_id' },
          { name: 'property1' },
          { name: 'property2' },
        ]);

        actions.addProperty({ name: 'property4', type: 'multiselect' }, 0)(dispatch, getState);
        expect(formActions.change).toHaveBeenCalledWith('template.data.properties', [
          {
            name: 'property4',
            type: 'multiselect',
            localID: 'unique_id',
            content: 'first_thesauri_id',
          },
          { name: 'property1' },
          { name: 'property2' },
        ]);
      });
    });

    describe('setPropertyDefaults for relationship type', () => {
      it('should add any entity or document (empty string) and inherit false as default values', () => {
        const properties = actions.setPropertyDefaults(getState, { type: 'relationship' });
        expect(properties).toEqual(
          expect.objectContaining({
            content: '',
            inherit: false,
          })
        );
      });
    });
  });

  describe('setNestedProperties()', () => {
    it('should update the property in the index provided', () => {
      actions.setNestedProperties(0, ['123', '456'])(dispatch, getState);
      expect(formActions.load).toHaveBeenCalledWith(
        'template.data.properties[0].nestedProperties',
        ['123', '456']
      );
    });
  });

  describe('updateProperty()', () => {
    it('should update the property in the index provided', () => {
      actions.updateProperty({ name: 'new name' }, 0)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('template.data.properties', [
        { name: 'new name' },
        { name: 'property2' },
      ]);
    });
  });

  describe('selectProperty()', () => {
    it('should return an SELECT_PROPERTY type action with the property index', () => {
      const action = actions.selectProperty('property index');
      expect(action).toEqual({ type: types.SELECT_PROPERTY, index: 'property index' });
    });
  });

  describe('resetTemplate()', () => {
    it('should reset the form data', () => {
      actions.resetTemplate()(dispatch);
      expect(formActions.reset).toHaveBeenCalledWith('template.data');
    });
  });

  describe('removeProperty', () => {
    it('should remove the property from the data', () => {
      actions.removeProperty(1)(dispatch);
      expect(formActions.remove).toHaveBeenCalledWith('template.data.properties', 1);
      expect(formActions.resetErrors).toHaveBeenCalledWith('template.data');
    });
  });

  describe('reorderProperty', () => {
    it('should reorder the properties in the form data', () => {
      actions.reorderProperty(1, 2)(dispatch);
      expect(formActions.move).toHaveBeenCalledWith('template.data.properties', 1, 2);
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      spyOn(notifications, 'notify');
      backend.restore();
      backend.post(`${APIURL}templates`, { body: JSON.stringify({ name: 'saved_template' }) });
    });

    afterEach(() => backend.restore());

    describe('saveTemplate', () => {
      it('should sanitize the properties before saving', () => {
        const originalTemplateData = {
          name: 'name',
          commonProperties: [{ title: 'Title' }],
          properties: [
            {
              localID: '1',
              label: 'label',
              type: 'relationship',
              inherit: true,
              relationType: '1',
              content: '',
              inserting: null,
            },
          ],
        };
        spyOn(api, 'save').and.callFake(async () =>
          Promise.resolve(actions.sanitize(originalTemplateData))
        );
        actions.saveTemplate(originalTemplateData)(() => {});
        expect(api.save).toHaveBeenCalledWith(
          new RequestParams({
            name: 'name',
            commonProperties: [{ title: 'Title' }],
            properties: [
              {
                content: '',
                inherit: false,
                label: 'label',
                relationType: '1',
                type: 'relationship',
              },
            ],
          })
        );
      });

      it('should save the template and dispatch a TEMPLATE_SAVED action', async () => {
        spyOn(formActions, 'merge').and.returnValue({ type: 'mergeAction' });
        const originalTemplateData = {
          name: 'my template',
          commonProperties: [{ title: 'Title' }],
          properties: [
            { localID: 'a1b2', label: 'my property' },
            { localID: 'a1b3', label: 'my property' },
          ],
        };
        const preparedResponse = actions.prepareTemplate(originalTemplateData);
        const expectedActions = [
          { type: types.SAVING_TEMPLATE },
          { type: types.TEMPLATE_SAVED, data: preparedResponse },
          { type: 'templates/UPDATE', value: preparedResponse },
          { type: 'mergeAction' },
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Saved successfully.', type: 'success', id: 'unique_id' },
          },
          { type: 'translations/SET', value: [] },
        ];
        const store = mockStore({});
        spyOn(api, 'save').and.callFake(async () =>
          Promise.resolve(actions.sanitize(originalTemplateData))
        );
        await store.dispatch(actions.saveTemplate(originalTemplateData));

        expect(store.getActions()).toEqual(expectedActions);
        expect(originalTemplateData.properties[0].localID).toBe('a1b2');
        expect(formActions.merge).toHaveBeenCalledWith('template.data', preparedResponse);
      });

      describe('on error', () => {
        it('should dispatch template_saved', async () => {
          jest.spyOn(api, 'save').mockRejectedValueOnce('error');
          spyOn(formActions, 'merge').and.returnValue({ type: 'mergeAction' });

          const originalTemplateData = {
            name: 'my template',
            commonProperties: [{ title: 'Title' }],
            properties: [{ localID: 'a1b2', label: 'my property' }],
          };

          const expectedActions = [
            { type: types.SAVING_TEMPLATE },
            { type: types.TEMPLATE_SAVED, data: originalTemplateData },
            { type: 'translations/SET', value: [] },
          ];

          const store = mockStore({});

          try {
            await store.dispatch(actions.saveTemplate(originalTemplateData));
          } catch {
            expect(store.getActions()).toEqual(expectedActions);
          }
        });
      });
    });
  });
});
