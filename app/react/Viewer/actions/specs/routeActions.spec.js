import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import * as relationships from 'app/Relationships/utils/routeUtils';

import * as routeActions from '../routeActions';

describe('Viewer routeActions', () => {
  const document = { _id: '1', sharedId: 'sid', title: 'title', pdfInfo: 'test' };
  const relationTypes = { rows: [{ name: 'Supports', _id: '1' }] };
  const references = [
    { _id: '1', connectedDocument: '1' },
    { _id: '2', connectedDocument: '2' },
  ];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}entities?sharedId=documentId`, { body: JSON.stringify({ rows: [document] }) })
      .get(`${APIURL}relationtypes`, { body: JSON.stringify(relationTypes) })
      .get(`${APIURL}references/by_document?sharedId=documentId`, {
        body: JSON.stringify(references),
      });

    spyOn(relationships, 'requestState').and.returnValue(
      Promise.resolve(['connectionsGroups', 'searchResults', 'sort'])
    );
  });

  afterEach(() => backend.restore());

  describe('setViewerState()', () => {
    let dispatch;
    let state;

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      spyOn(relationships, 'setReduxState').and.callFake(argState => ({
        type: 'relationshipsSetReduxState',
        value: argState,
      }));

      state = {
        documentViewer: {
          doc: 'doc',
          references: 'references',
          templates: 'templates',
          thesauris: 'thesauris',
          relationTypes: 'relationTypes',
          rawText: 'rawText',
        },
        relationTypes: 'relationTypes',
      };

      routeActions.setViewerState(state)(dispatch);
    });

    it('should call setTemplates with templates passed', () => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationTypes/SET', value: 'relationTypes' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_REFERENCES', references: 'references' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/doc/SET', value: 'doc' });
      expect(dispatch).toHaveBeenCalledWith({
        type: 'viewer/relationTypes/SET',
        value: 'relationTypes',
      });
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationshipsSetReduxState', value: state });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/rawText/SET', value: 'rawText' });
    });
  });
});
