import React, { Component, PropTypes } from 'react'
import ViewerController from '../ViewerController';
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../../config.js'
import Provider from '../../App/Provider'
import api from '../../../utils/singleton_api'
import TextRange from 'batarange'

describe('ViewerController', () => {

  let documentResponse = [{key:'template1', id:'1', value:{pages:[], css:[]}}];

  let component;

  beforeEach(() => {
    let initialData = {};
    let params = {};
    let history = {};
    TestUtils.renderIntoDocument(<Provider><ViewerController history={history} params={params} ref={(ref) => component = ref} /></Provider>);
    backend.restore();
    backend
    .mock(APIURL+'documents?_id=1', 'GET', {body: JSON.stringify({rows:documentResponse})})
    .mock(APIURL+'references', 'POST', {body: JSON.stringify({})});
  });

  describe('static requestState', () => {
    it('should request for the document with id passed', (done) => {
      let id = 1;
      ViewerController.requestState({documentId:id}, api)
      .then((response) => {
        expect(response).toEqual(documentResponse[0]);
        done();
      })
      .catch(done.fail)
    });
  });

  describe('openModal()', () => {
    it('should setState openModal to true and showReferenceLink to false', () => {
      component.openModal();

      expect(component.state.openModal).toBe(true);
      expect(component.state.showReferenceLink).toBe(false);
    });
  });

  describe('closeModal()', () => {
    it('should setState openModal to false', () => {
      component.closeModal();

      expect(component.state.openModal).toBe(false);
    });
  });

  describe('textSelection()', () => {

    describe('when no text selected', () => {
      it('should set showReferenceLink and openModal to false', () => {
        stubSelection();
        component.textSelection();

        expect(component.state.openModal).toBe(false);
        expect(component.state.showReferenceLink).toBe(false);
      });
    });

    describe('when text selected', function(){
      it('should showReferenceLink and set the top position of the text - 60', function(){
        stubSelection('selectedText');
        component.textSelection();

        expect(component.state.showReferenceLink).toBe(true);
        expect(component.state.textSelectedTop).toBe(40);
      });

      it('should save the selection in component.selection', () => {
        stubSelection('selectedText');
        component.textSelection();

        expect(component.selection.range).toBe('range');
      });
    });

    describe('createReference', () => {

      beforeEach(() => {
        spyOn(TextRange, 'serialize').and.returnValue({range:'range'});
        spyOn(component, 'closeModal');
        component.selection = 'range';
        component.state.value.id = 'documentId';
      });

      it('should save the range reference', (done) => {
        component.createReference()
        .then(() => {
          expect(TextRange.serialize).toHaveBeenCalledWith('range', component.contentContainer);
          expect(backend.calls().matched[0][0]).toBe(APIURL+'references');
          expect(backend.calls().matched[0][1].body).toBe(JSON.stringify({range: 'range', sourceDocument:'documentId'}));
          expect(component.closeModal).toHaveBeenCalled();
          done();
        });
      });

      it('should wrap the selected text after savinf the reference with a span', (done) => {

        component.state.value.pages = ['page 1'];
        component.setState(component.state);

        let range = document.createRange();
        let page1 = component.contentContainer.childNodes[0].childNodes[0];

        range.setStart(page1, 1);
        range.setEnd(page1, 3);

        TextRange.restore = function(){
          return range;
        }

        component.createReference()
        .then(() => {
          expect(component.contentContainer.childNodes[0].innerHTML).toBe('p<span class="reference">ag</span>e 1');
          done();
        });
      });
    });

  });

  let stubSelection = (selection = '') => {
    window.getSelection = () => {
      return {
        toString: () => {
          return selection;
        },
        getRangeAt: () => {
          return {
            range: 'range',
            getClientRects: () => {
              return [{top:100}];
            }
          }
        }
      }
    }
  }

});
