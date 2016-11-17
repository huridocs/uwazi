import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('Viewer routeActions', () => {
  let document = {_id: '1', title: 'title'};
  let templates = {rows: [{name: 'Decision', _id: 'abc1', properties: []}, {name: 'Ruling', _id: 'abc2', properties: []}]};
  let thesauris = {rows: [{name: 'countries', _id: '1', values: []}]};
  let relationTypes = {rows: [{name: 'Supports', _id: '1'}]};
  let references = [{_id: '1', connectedDocument: '1'}, {_id: '2', connectedDocument: '2'}];

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'documents?_id=documentId', 'GET', {body: JSON.stringify({rows: [document]})})
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify(templates)})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify(thesauris)})
    .mock(APIURL + 'relationtypes', 'GET', {body: JSON.stringify(relationTypes)})
    .mock(APIURL + 'references/by_document/documentId', 'GET', {body: JSON.stringify(references)});
  });
});
