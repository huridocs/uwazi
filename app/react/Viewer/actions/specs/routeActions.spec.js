import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import * as relationships from 'app/Relationships/utils/routeUtils';
import entitiesApi from 'app/Entities/EntitiesAPI';

import * as routeActions from '../routeActions';

describe('Viewer routeActions', () => {
  const document = { _id: '1', sharedId: 'sid', title: 'title', pdfInfo: 'test' };
  const relationTypes = { rows: [{ name: 'Supports', _id: '1' }] };
  const references = [{ _id: '1', connectedDocument: '1' }, { _id: '2', connectedDocument: '2' }];

  beforeEach(() => {
    backend.restore();
    backend
    .get(`${APIURL}entities?_id=documentId`, { body: JSON.stringify({ rows: [document] }) })
    .get(`${APIURL}relationtypes`, { body: JSON.stringify(relationTypes) })
    .get(`${APIURL}references/by_document/documentId`, { body: JSON.stringify(references) });

    spyOn(relationships, 'requestState').and.returnValue(Promise.resolve(['connectionsGroups', 'searchResults', 'sort']));
  });

  afterEach(() => backend.restore());

  describe('requestViewerState', () => {
    it('should request for the document passed, and return an object to populate the state', (done) => {
      routeActions.requestViewerState({ documentId: 'documentId' }, { templates: [] })
      .then((state) => {
        const documentResponse = state.documentViewer.doc;
        const relationTypesResponse = state.documentViewer.relationTypes;

        expect(documentResponse._id).toBe('1');
        expect(relationTypesResponse).toEqual(relationTypes.rows);
        expect(state.relationTypes).toEqual(relationTypes.rows);
        done();
      })
      .catch(done.fail);
    });

    it('should request for the raw text when raw param is true', (done) => {
      spyOn(entitiesApi, 'getRawPage').and.returnValue('text');

      routeActions.requestViewerState({ documentId: 'documentId', raw: true, page: 3 }, { templates: [] })
      .then((state) => {
        const documentResponse = state.documentViewer.doc;
        const relationTypesResponse = state.documentViewer.relationTypes;

        expect(documentResponse._id).toBe('1');
        expect(relationTypesResponse).toEqual(relationTypes.rows);
        expect(state.relationTypes).toEqual(relationTypes.rows);

        expect(entitiesApi.getRawPage).toHaveBeenCalledWith('documentId', 3);
        expect(state.documentViewer.rawText).toEqual('text');
        done();
      })
      .catch(done.fail);
    });

    it('should assign the references', (done) => {
      routeActions.requestViewerState({ documentId: 'documentId', lang: 'es' }, { templates: [] })
      .then((state) => {
        expect(state.documentViewer.references).toEqual(references);
        done();
      })
      .catch(done.fail);
    });

    it('should assign the relationships', (done) => {
      routeActions.requestViewerState({ documentId: 'documentId', lang: 'es' }, { templates: [] })
      .then((state) => {
        const expectedRelationships = {
          list: {
            entityId: 'sid',
            entity: document,
            connectionsGroups: 'connectionsGroups',
            searchResults: 'searchResults',
            sort: 'sort',
            filters: {},
            view: 'graph'
          }
        };

        expect(state.relationships).toEqual(expectedRelationships);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setViewerState()', () => {
    let dispatch;
    let state;

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      spyOn(relationships, 'setReduxState').and.callFake(argState => ({ type: 'relationshipsSetReduxState', value: argState }));

      state = {
        documentViewer:
        {
          doc: 'doc',
          references: 'references',
          templates: 'templates',
          thesauris: 'thesauris',
          relationTypes: 'relationTypes',
          rawText: 'rawText',
        },
        relationTypes: 'relationTypes'
      };

      routeActions.setViewerState(state)(dispatch);
    });

    it('should call setTemplates with templates passed', () => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationTypes/SET', value: 'relationTypes' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_REFERENCES', references: 'references' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/doc/SET', value: 'doc' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/relationTypes/SET', value: 'relationTypes' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationshipsSetReduxState', value: state });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/rawText/SET', value: 'rawText' });
    });
  });
});
