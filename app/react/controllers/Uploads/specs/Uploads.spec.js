import React from 'react';
import Uploads from '../Uploads';
import backend from 'fetch-mock';
import TestUtils from 'react-addons-test-utils';
import {APIURL} from '../../../config.js';
import {events} from '../../../utils/index';
import API from '../../../utils/singleton_api';
import MockProvider from '../../App/specs/MockProvider';
import {shallow} from 'enzyme';

describe('UploadsController', () => {
  let documents = [{key: 'secret documents', value: {}}, {key: 'real batman id', value: {}}];
  let templates = [{name: 'batarang', properties: []}, {name: 'batmovil'}];
  let thesauris = [{_id: 'thesauriID', values: [{label: 'thesauri1', id: '1'}, {label: 'thesauri2', id: '2'}]}];
  let component;
  let router = {};
  let user = {};

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'documents', 'GET', {body: JSON.stringify({rows: documents})})
    .mock(APIURL + 'uploads', 'GET', {body: JSON.stringify({rows: documents})})
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauris})})
    .mock(APIURL + 'documents', 'POST', {});
  });

  describe('static requestState', () => {
    it('should request documents and templates', (done) => {
      Uploads.requestState(null, API)
      .then((response) => {
        expect(response.documents).toEqual(documents);
        expect(response.templates).toEqual(templates);
        expect(response.thesauris).toEqual(thesauris);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('deleteDocument', () => {
    beforeEach(() => {
      backend.restore();
      backend
      .mock(APIURL + 'documents', 'DELETE', {body: {test: 'test'}})
      .mock(APIURL + 'documents', 'GET', {body: JSON.stringify({rows: documents})});
      TestUtils.renderIntoDocument(<MockProvider router={router}><Uploads user={user} ref={(ref) => component = ref}/></MockProvider>);
    });

    it('shoult request to delete the document', (done) => {
      component.deleteDocument({value: {_id: 'documentId', _rev: 'rev', another: 'another'}})
      .then(() => {
        let calls = backend.calls(APIURL + 'documents');
        expect(calls[0][1].method).toBe('DELETE');
        expect(calls[0][1].body).toEqual(JSON.stringify({_id: 'documentId', _rev: 'rev'}));

        expect(component.state.documents).toEqual(documents);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('when a new document is uploaded', () => {
    let doc = {id: 'id_1', value: {title: 'Robin secret diary'}};

    beforeEach(() => {
      TestUtils.renderIntoDocument(<MockProvider router={router}><Uploads user={user} ref={(ref) => component = ref}/></MockProvider>);
      component.setState({documents: [{id: 'id_0', value: {title: 'Enigma answers'}}]});
    });

    it('should add the document first of the list', () => {
      events.emit('newDocument', doc);
      expect(component.state.documents[0]).toBe(doc);
    });

    it('should set the progress to the doc', () => {
      events.emit('newDocument', doc);
      events.emit('uploadProgress', 'id_1', 20);
      expect(component.state.documents[0].progress).toBe(20);
    });

    it('when it ends should set file to the doc', () => {
      events.emit('newDocument', doc);
      events.emit('uploadProgress', 'id_1', 20);
      events.emit('uploadEnd', 'id_1', {filename: 'as1hd123ha', originalname: 'Engima answers'});
      expect(component.state.documents[0].progress).toBeNull();
      expect(component.state.documents[0].value.file).toEqual({filename: 'as1hd123ha', originalname: 'Engima answers'});
    });
  });

  describe('when editing a document', () => {
    let wrapper;

    beforeEach(() => {
      // TestUtils.renderIntoDocument(<MockProvider router={router}><Uploads user={user} ref={(ref) => component = ref}/></MockProvider>);
      let context = {getInitialData: () => {}};
      wrapper = shallow(<Uploads user={user} />, {context});
      component = wrapper.instance();
      component.setState({documents: [{id: 'id_0', value: {title: 'Enigma answers'}}]});
    });

    describe('editDocument()', () => {
      it('should set on state the document being edited', () => {
        component.state.templates = [
          {_id: '1', name: 'template1', properties: []}, {_id: '2', name: 'template2', properties: []}
        ];
        component.editDocument({value: {id: 1}});
        expect(component.state.documentBeingEdited).toEqual({value: {id: 1, template: '1'}});
      });

      it('should set on state the template document have', () => {
        component.state.templates = [
          {_id: '1', name: 'template1', properties: []}, {_id: '2', name: 'template2', properties: []}
        ];
        component.editDocument({value: {id: 1, template: '2'}});
        expect(component.state.template).toEqual({_id: '2', name: 'template2', properties: []});
      });

      describe('when document does not have a template', () => {
        it('should set the first template as the default', () => {
          component.state.templates = [
            {_id: '1', name: 'template1', properties: []}, {_id: '2', name: 'template2', properties: []}
          ];
          component.editDocument({value: {id: 1}});
          expect(component.state.template).toEqual({_id: '1', name: 'template1', properties: []});
          expect(component.state.documentBeingEdited.value.template).toBe('1');
        });
      });
    });

    describe('cancelEdit()', () => {
      it('should set on state the document being edited to undefined', () => {
        component.cancelEdit();
        expect(component.state.documentBeingEdited).toBe(null);
      });
    });

    // describe('saveDocument()', () => {
    //   it('should save the template used', (done) => {
    //     component.setState({documentBeingEdited: {value: {id: 1, title: 'the dark knight'}}});
    //     component.templateField.value = () => {
    //       return 'template_id';
    //     };
    //
    //     component.form.value = () => {
    //       return {key: 'value'};
    //     };
    //
    //     backend.reset();
    //     component.saveDocument()
    //     .then(() => {
    //       let calls = backend.calls(APIURL + 'documents');
    //       expect(calls[0][1].method).toBe('POST');
    //       expect(calls[0][1].body).toEqual(JSON.stringify(
    //         {id: 1, title: 'the dark knight', template: 'template_id', metadata: {key: 'value'}}
    //       ));
    //       done();
    //     })
    //     .catch(done.fail);
    //   });
    // });

    // describe('moveToLibrary()', () => {
    //   it('should save the document as published', (done) => {
    //     component.setState({documentBeingEdited: documents[0], documents: documents});
    //     backend.reset();
    //     component.moveToLibrary()
    //     .then(() => {
    //       let calls = backend.calls(APIURL + 'documents');
    //       expect(calls[0][1].method).toBe('POST');
    //       expect(JSON.parse(calls[0][1].body).published).toBe(true);
    //       expect(component.state.documents.length).toBe(1);
    //       expect(component.state.documentBeingEdited).toBe(null);
    //       done();
    //     })
    //     .catch(done.fail);
    //   });
    // });
  });
});
