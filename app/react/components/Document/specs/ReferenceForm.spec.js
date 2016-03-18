import React from 'react';
import ReferenceForm from '../ReferenceForm.js';
import TestUtils from 'react-addons-test-utils';
import backend from 'fetch-mock';
import {APIURL} from '../../../config.js';

describe('ReferenceForm', () => {
  let component;

  let documents = [{key: 'secret documents', value: {}}, {key: 'real batman id', value: {}}];
  let searchDocuments = [{_id: 'doc1', value: {}}, {_id: 'doc2', value: {}}];
  let onSubmit;

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'documents/search', 'GET', {body: JSON.stringify(documents)})
    .mock(APIURL + 'documents/search?searchTerm=searchTerm', 'GET', {body: JSON.stringify(searchDocuments)});

    onSubmit = jasmine.createSpy('onSubmit');
    component = TestUtils.renderIntoDocument(<ReferenceForm onSubmit={onSubmit}/>);
  });

  describe('submit()', () => {
    it('should call props.onSubmit passing the value', () => {
      component.title.value = 'title';
      component.state.documentSelected = 'documentSelected';
      component.submit();

      expect(onSubmit).toHaveBeenCalledWith({title: 'title', targetDocument: 'documentSelected'});
    });
  });

  describe('on instance', () => {
    it('should be hidden by default', () => {
      expect(component.modalElement.className.match(/hidden/)[0]).toBe('hidden');
    });
  });

  describe('show()', () => {
    it('should remove hidden className', () => {
      component.show();
      expect(component.modalElement.className.match(/hidden/)).toBe(null);
    });
  });

  describe('hide()', () => {
    it('should add hidden className', () => {
      component.hide();
      expect(component.modalElement.className.match(/hidden/)[0]).toBe('hidden');
    });
  });

  describe('value()', () => {
    it('should return title and selectedDocument', () => {
      component.title.value = 'test title';
      component.state.documentSelected = 'doc1';

      let value = component.value();
      expect(value).toEqual({title: 'test title', targetDocument: 'doc1'});
    });
  });

  describe('selectPart()', () => {
    it('should set selectPart state to true', () => {
      component.selectPart();
      expect(component.state.selectPart).toBe(true);
    });
  });

  describe('selectEntire()', () => {
    it('should set selectPart state to false', () => {
      component.selectEntire();
      expect(component.state.selectPart).toBe(false);
    });
  });

  describe('selectDocument()', () => {
    it('should set state.documentSelected with the id passed', () => {
      component.selectDocument('documentId');
      expect(component.state.documentSelected).toEqual('documentId');
    });

    it('should add class selected to the selectedDocument list element', () => {
      component.setState({documents: [
        {_id: '1', title: 'document1'},
        {_id: '2', title: 'document2'}
      ]});

      let documentLiElements = TestUtils.scryRenderedDOMComponentsWithTag(component, 'li');

      component.selectDocument('1');
      expect(documentLiElements[0].className).toBe('selected');
      expect(documentLiElements[1].className).toBe('');

      component.selectDocument('2');
      expect(documentLiElements[0].className).toBe('');
      expect(documentLiElements[1].className).toBe('selected');
    });
  });

  describe('search()', () => {
    it('should request documents', (done) => {
      component.searchField.value = 'searchTerm';

      component.search()
      .then(() => {
        expect(component.state.documents).toEqual(searchDocuments);
        done();
      })
      .catch(done.fail);
    });

    describe('when it finishes', () => {
      it('should set the first document as selected', (done) => {
        component.searchField.value = 'searchTerm';

        component.search()
        .then(() => {
          expect(component.state.documentSelected).toBe('doc1');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when no documents returned', () => {
      it('should not try to set documentSelected', (done) => {
        component.searchField.value = 'searchTerm';
        backend
        .reMock(APIURL + 'documents/search?searchTerm=searchTerm', 'GET', {body: JSON.stringify([])});

        component.search()
        .then(() => {
          done('without error');
        })
        .catch(done.fail);
      });
    });
  });
});
