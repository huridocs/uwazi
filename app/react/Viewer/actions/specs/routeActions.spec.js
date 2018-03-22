import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

import * as routeActions from '../routeActions';
import * as relationships from 'app/Relationships/utils/routeUtils';

describe('Viewer routeActions', () => {
  let document = {_id: '1', sharedId: 'sid', title: 'title', pdfInfo: 'test'};
  let relationTypes = {rows: [{name: 'Supports', _id: '1'}]};
  let references = [{_id: '1', connectedDocument: '1'}, {_id: '2', connectedDocument: '2'}];

  beforeEach(() => {
    backend.restore();
    backend
    .get(APIURL + 'entities?_id=documentId', {body: JSON.stringify({rows: [document]})})
    .get(APIURL + 'relationtypes', {body: JSON.stringify(relationTypes)})
    .get(APIURL + 'references/by_document/documentId', {body: JSON.stringify(references)});

    spyOn(relationships, 'requestState').and.returnValue(Promise.resolve(['connectionsGroups', 'searchResults', 'sort']));
  });

  afterEach(() => backend.restore());

  describe('requestViewerState', () => {
    it('should request for the document passed, and return an object to populate the state', (done) => {
      routeActions.requestViewerState('documentId', 'es', {templates: []})
      .then((state) => {
        let documentResponse = state.documentViewer.doc;
        let relationTypesResponse = state.documentViewer.relationTypes;

        expect(documentResponse._id).toBe('1');
        expect(relationTypesResponse).toEqual(relationTypes.rows);
        expect(state.relationTypes).toEqual(relationTypes.rows);
        done();
      })
      .catch(done.fail);
    });

    it('should assign the references', (done) => {
      routeActions.requestViewerState('documentId', 'es', {templates: []})
      .then((state) => {
        expect(state.documentViewer.references).toEqual(references);
        done();
      })
      .catch(done.fail);
    });

    it('should assign the relationships', (done) => {
      routeActions.requestViewerState('documentId', 'es', {templates: []})
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
      spyOn(relationships, 'setReduxState').and.callFake((argState) => {
        return {type: 'relationshipsSetReduxState', value: argState};
      });

      state = {
        documentViewer:
        {
          doc: 'doc',
          references: 'references',
          templates: 'templates',
          thesauris: 'thesauris',
          relationTypes: 'relationTypes'
        },
        relationTypes: 'relationTypes'
      };

      routeActions.setViewerState(state)(dispatch);
    });

    it('should call setTemplates with templates passed', () => {
      expect(dispatch).toHaveBeenCalledWith({type: 'relationTypes/SET', value: 'relationTypes'});
      expect(dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: 'references'});
      expect(dispatch).toHaveBeenCalledWith({type: 'viewer/doc/SET', value: 'doc'});
      expect(dispatch).toHaveBeenCalledWith({type: 'viewer/relationTypes/SET', value: 'relationTypes'});
      expect(dispatch).toHaveBeenCalledWith({type: 'relationshipsSetReduxState', value: state});
    });
  });
});
