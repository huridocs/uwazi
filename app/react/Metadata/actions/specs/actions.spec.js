/* eslint-disable max-lines */
import * as reactReduxForm from 'react-redux-form';
import Immutable from 'immutable';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mockID } from 'shared/uniqueID.js';
import { api } from 'app/Entities';
import { RequestParams } from 'app/utils/RequestParams';
import * as actions from '../actions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Metadata Actions', () => {
  describe('loadInReduxForm', () => {
    beforeEach(() => {
      spyOn(api, 'get');
    });

    it('should request the document and load with default metadata properties if not present', async () => {
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formload');
      const dispatch = jasmine.createSpy('dispatch');
      const doc = {
        sharedId: '1',
        title: 'updated title',
        template: 'templateId',
        metadata: { test: [{ value: 'test' }], test2: [{ value: 'test2' }] },
        attachments: [
          { originalname: 'z file' },
          { originalname: 'B file' },
          { originalname: 'a file' },
        ],
      };
      api.get.and.returnValue(Promise.resolve([doc]));
      const templates = [
        {
          _id: 'templateId',
          commonProperties: [{ name: 'title', generatedId: false }],
          properties: [
            { name: 'test' },
            { name: 'newProp' },
            { name: 'testRelation', type: 'relationship' },
            { name: 'id', type: 'generatedid' },
          ],
        },
      ];

      await actions.loadInReduxForm(
        'formNamespace',
        { sharedId: '1', title: 'old title' },
        templates
      )(dispatch);

      const expectedDoc = {
        sharedId: '1',
        title: 'updated title',
        template: 'templateId',
        metadata: { test: 'test', id: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/) },
        attachments: [
          { originalname: 'a file' },
          { originalname: 'B file' },
          { originalname: 'z file' },
        ],
      };

      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      expect(api.get).toHaveBeenCalledWith(new RequestParams({ sharedId: '1' }));
    });

    describe('When doc has no template', () => {
      let dispatch;
      let doc;
      let templates;

      beforeEach(() => {
        spyOn(reactReduxForm.actions, 'load').and.returnValue('formload');
        spyOn(reactReduxForm.actions, 'reset').and.returnValue('formreset');
        dispatch = jasmine.createSpy('dispatch');
        doc = { title: 'test' };
        templates = [
          {
            _id: 'templateId1',
            name: 'first',
            default: true,
            commonProperties: [{ name: 'title', generatedId: false }],
            properties: [
              { name: 'test' },
              { name: 'newProp' },
              { name: 'date', type: 'date' },
              { name: 'multi', type: 'multiselect' },
              { name: 'geolocation', type: 'geolocation' },
            ],
          },
          {
            _id: 'templateId2',
            name: 'last',
            commonProperties: [],
            properties: [
              { name: 'test' },
              { name: 'newProp' },
              { name: 'date', type: 'date' },
              { name: 'multi', type: 'multiselect' },
            ],
          },
        ];
      });

      it('should set the first template', async () => {
        await actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);

        const expectedDoc = { title: 'test', metadata: {}, template: 'templateId1' };
        expect(dispatch).toHaveBeenCalledWith('formreset');
        expect(dispatch).toHaveBeenCalledWith('formload');
        expect(reactReduxForm.actions.reset).toHaveBeenCalledWith('formNamespace');
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });
    });

    describe('generatedId as title', () => {
      const templates = [
        {
          _id: 'templateId',
          commonProperties: [{ name: 'title', generatedId: true }],
          properties: [],
        },
      ];
      const dispatch = jasmine.createSpy('dispatch');
      beforeEach(() => {
        spyOn(reactReduxForm.actions, 'load').and.returnValue('formload');
      });
      it('should set a generatedId value as title if it is configured with this option', async () => {
        const expectedDoc = {
          sharedId: '1',
          template: 'templateId',
          title: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/),
          metadata: {},
        };
        const doc = { sharedId: '1', template: 'templateId' };
        api.get.and.returnValue(Promise.resolve([doc]));
        await actions.loadInReduxForm('formNamespace', { sharedId: '1' }, templates)(dispatch);
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });

      it('should keep the title if it is already set', async () => {
        const expectedDoc = {
          sharedId: '1',
          title: 'previousTitle',
          template: 'templateId',
          metadata: {},
        };
        const doc = { sharedId: '1', title: 'previousTitle', template: 'templateId' };
        api.get.and.returnValue(Promise.resolve([doc]));
        await actions.loadInReduxForm('formNamespace', { sharedId: '1' }, templates)(dispatch);
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });
    });
  });

  describe('changeTemplate', () => {
    let dispatch;
    let state;

    beforeEach(() => {
      jasmine.clock().install();

      spyOn(reactReduxForm.actions, 'reset').and.returnValue('formReset');
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formLoad');
      spyOn(reactReduxForm.actions, 'setDirty');

      dispatch = jasmine.createSpy('dispatch');

      const template = {
        _id: 'newTemplate',
        commonProperties: [{ name: 'title', generatedId: false }],
        properties: [
          { name: 'test' },
          { name: 'newProp', type: 'nested' },
          { name: 'id', type: 'generatedid' },
        ],
      };
      state = {
        templates: Immutable.fromJS([
          template,
          { _id: 'templateId', properties: [{ name: 'test' }, { name: 'test2' }] },
        ]),
      };
    });

    describe('existing entity', () => {
      beforeEach(() => {
        const doc = {
          _id: 'entityId',
          title: 'test',
          template: 'templateId',
          metadata: { test: [{ value: 'test' }], test2: [{ value: 'test2' }] },
        };
        spyOn(reactReduxForm, 'getModel').and.returnValue(doc);
      });

      afterEach(() => {
        jasmine.clock().uninstall();
      });

      it('should change the document template preserve matching values', () => {
        const getState = () => state;

        actions.changeTemplate('formNamespace', 'newTemplate')(dispatch, getState);
        expect(reactReduxForm.getModel).toHaveBeenCalledWith(state, 'formNamespace');

        const expectedDoc = {
          _id: 'entityId',
          title: 'test',
          template: 'newTemplate',
          metadata: {
            test: [{ value: 'test' }],
            newProp: [],
            id: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/),
          },
        };
        expect(dispatch).toHaveBeenCalledWith('formReset');
        expect(reactReduxForm.actions.reset).toHaveBeenCalledWith('formNamespace');
        jasmine.clock().tick(0);
        expect(dispatch).toHaveBeenCalledWith('formLoad');
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });
    });
    describe('generatedId as entity title', () => {
      const template = {
        _id: 'newTemplate',
        properties: [],
        commonProperties: [{ name: 'title', generatedId: true }],
      };
      const stateGeneratedIdTest = {
        templates: Immutable.fromJS([template, { _id: 'templateId', properties: [] }]),
      };
      const getState1 = () => stateGeneratedIdTest;

      it('should set a generatedId as title if the new template has that option', () => {
        const doc = {
          _id: 'entityId',
          template: 'templateId',
          metadata: {},
        };
        spyOn(reactReduxForm, 'getModel').and.returnValue(doc);

        actions.changeTemplate('formNamespace', 'newTemplate')(dispatch, getState1);
        expect(reactReduxForm.getModel).toHaveBeenCalledWith(stateGeneratedIdTest, 'formNamespace');

        const expectedDoc1 = {
          _id: 'entityId',
          title: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/),
          template: 'newTemplate',
          metadata: {},
        };
        jasmine.clock().tick(0);
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc1);
      });

      it('should keep the title if it is already set', () => {
        const doc = {
          _id: 'entityId',
          title: 'test',
          template: 'templateId',
          metadata: {},
        };
        spyOn(reactReduxForm, 'getModel').and.returnValue(doc);

        actions.changeTemplate('formNamespace', 'newTemplate')(dispatch, getState1);
        expect(reactReduxForm.getModel).toHaveBeenCalledWith(stateGeneratedIdTest, 'formNamespace');

        const expectedDoc1 = {
          _id: 'entityId',
          title: 'test',
          template: 'newTemplate',
          metadata: {},
        };
        jasmine.clock().tick(0);
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc1);
      });
    });
  });

  describe('loadTemplate', () => {
    it('should load the given template with empty values', () => {
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formLoad');

      const template = {
        _id: '1',
        properties: [
          { name: 'year', type: 'numeric' },
          { name: 'dates', type: 'daterange' },
          { name: 'powers', content: '1', type: 'multiselect' },
          { name: 'enemies', content: '2', type: 'multiselect' },
          { name: 'color', type: 'text', required: true },
          { name: 'id', type: 'generatedid' },
        ],
      };

      const expectedModel = {
        template: '1',
        metadata: {
          year: '',
          powers: [],
          enemies: [],
          color: '',
          dates: { from: null, to: null },
        },
      };

      const dispatch = jasmine.createSpy('dispatch');
      actions.loadTemplate('formNamespace', template)(dispatch);
      expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedModel);
    });
  });

  describe('multipleUpdate', () => {
    it('should update selected entities with the given metadata and template', async () => {
      mockID();
      const responseMetadata = { text: 'something new' };
      const entities = Immutable.fromJS([{ sharedId: '1' }, { sharedId: '2' }]);
      spyOn(api, 'multipleUpdate').and.returnValue(
        Promise.resolve([
          { sharedId: '1', metadata: responseMetadata },
          { sharedId: '2', metadata: responseMetadata },
        ])
      );
      const template = 'template';

      const store = mockStore({});
      const docs = await store.dispatch(
        actions.multipleUpdate(entities, { template, metadata: { changed: 'changed' } })
      );
      expect(api.multipleUpdate).toHaveBeenCalledWith(
        new RequestParams({
          ids: ['1', '2'],
          values: { template, metadata: { changed: 'changed' } },
        })
      );
      expect(docs[0]).toEqual(
        expect.objectContaining({
          metadata: expect.objectContaining(responseMetadata),
        })
      );
      expect(docs[1]).toEqual(
        expect.objectContaining({
          metadata: expect.objectContaining(responseMetadata),
        })
      );
    });
  });
});
