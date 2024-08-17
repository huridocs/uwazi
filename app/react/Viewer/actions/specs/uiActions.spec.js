/**
 * @jest-environment jsdom
 *
 */
import Immutable from 'immutable';

import Marker from 'app/Viewer/utils/Marker.js';
import * as actions from 'app/Viewer/actions/uiActions';
import scroller from 'app/Viewer/utils/Scroller';
import * as types from 'app/Viewer/actions/actionTypes';

describe('Viewer uiActions', () => {
  describe('closePanel()', () => {
    it('should return a CLOSE_PANEL with panel passed', () => {
      const action = actions.closePanel();
      expect(action).toEqual({ type: types.CLOSE_PANEL });
    });
  });
  describe('openPanel()', () => {
    it('should return a OPEN_PANEL with panel passed', () => {
      const action = actions.openPanel('a panel');
      expect(action).toEqual({ type: types.OPEN_PANEL, panel: 'a panel' });
    });
  });
  describe('selectTargetDocument()', () => {
    it('should return a SELECT_TARGET_DOCUMENT with id', () => {
      const action = actions.selectTargetDocument('id');
      expect(action).toEqual({ type: types.SELECT_TARGET_DOCUMENT, id: 'id' });
    });
  });
  describe('selectTargetDocument()', () => {
    it('should return a SELECT_TARGET_DOCUMENT with id', () => {
      const action = actions.selectTargetDocument('id');
      expect(action).toEqual({ type: types.SELECT_TARGET_DOCUMENT, id: 'id' });
    });
  });

  describe('highlightReference()', () => {
    it('should return a HIGHLIGHT_REFERENCE with id', () => {
      const action = actions.highlightReference('id');
      expect(action).toEqual({ type: types.HIGHLIGHT_REFERENCE, reference: 'id' });
    });
  });

  describe('deactivateReference', () => {
    it('should dispatch a DEACTIVATE_REFERENCE with id', () => {
      const action = actions.deactivateReference('id');
      expect(action).toEqual({ type: types.DEACTIVATE_REFERENCE });
    });
  });

  describe('scrollToActive', () => {
    let dispatch;
    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      spyOn(actions, 'activateReference').and.returnValue({ type: 'activateReference' });
    });

    it('should scroll to active if goToActive is true', () => {
      actions.scrollToActive(
        {
          _id: 'id',
          reference: { selectionRectangles: [{ top: 40, page: '1' }], text: 'something' },
        },
        '',
        true
      )(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: types.GO_TO_ACTIVE, value: false });
    });
  });

  describe('activateReference()', () => {
    let dispatch;
    beforeEach(() => {
      spyOn(scroller, 'to');
      spyOn(window.document, 'querySelector').and.returnValue(true);
      dispatch = jasmine.createSpy('dispatch');
    });

    it('should dispatch a ACTIVATE_REFERENCE with id', () => {
      actions.activateReference({
        _id: 'id',
        reference: {
          selectionRectangles: [{ top: 40, page: '1', _id: 'selectionId' }],
          text: 'something',
        },
        file: 'fileId',
      })(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: types.DEACTIVATE_REFERENCE });
      expect(dispatch).toHaveBeenCalledWith({ type: types.ACTIVE_REFERENCE, reference: 'id' });
      expect(dispatch).toHaveBeenCalledWith({ type: types.OPEN_PANEL, panel: 'viewMetadataPanel' });
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_SELECTION,
        sourceFile: 'fileId',
        sourceRange: {
          selectionRectangles: [
            {
              page: '1',
              top: 40,
            },
          ],
          text: 'something',
        },
      });
      expect(dispatch).toHaveBeenCalledWith({
        type: 'viewer.sidepanel.tab/SET',
        value: 'references',
      });
    });

    it('should activate multiple references', () => {
      actions.activateReference(
        {
          _id: 'id',
          reference: {
            selectionRectangles: [{ top: 40, page: '1', _id: 'selectionId' }],
            text: 'something',
          },
          file: 'fileId',
        },
        ['id', 'id2']
      )(dispatch);

      expect(dispatch).not.toHaveBeenCalledWith({ type: types.ACTIVE_REFERENCE });
      expect(dispatch).toHaveBeenCalledWith({
        type: types.ACTIVATE_MULTIPLE_REFERENCES,
        references: ['id', 'id2'],
      });
    });

    it('should dispatch a SHOW_TAB references by default', () => {
      actions.activateReference({
        _id: 'id',
        reference: { selectionRectangles: [{ top: 40, page: '1' }], text: 'something' },
      })(dispatch);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'viewer.sidepanel.tab/SET',
        value: 'references',
      });
    });

    it('should dispatch a SHOW_TAB to a diferent tab if passed', () => {
      actions.activateReference(
        {
          _id: 'id',
          reference: { selectionRectangles: [{ top: 40, page: '1' }], text: 'something' },
        },
        [],
        'another tab'
      )(dispatch);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'viewer.sidepanel.tab/SET',
        value: 'another tab',
      });
    });

    it('should dispatch a SHOW_TAB references if Array is passed (when selecting a doc reference)', () => {
      actions.activateReference(
        {
          _id: 'id',
          reference: { selectionRectangles: [{ top: 40, page: '1' }], text: 'something' },
        },
        []
      )(dispatch);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'viewer.sidepanel.tab/SET',
        value: 'references',
      });
    });

    it('should goToActive on delayActivation', () => {
      actions.activateReference(
        {
          _id: 'id',
          reference: { selectionRectangles: [{ top: 40, page: '1' }], text: 'something' },
        },
        undefined,
        [],
        true
      )(dispatch);
      expect(dispatch).toHaveBeenCalledWith(actions.goToActive());
    });

    it('should scroll to the elements', done => {
      actions.activateReference({
        _id: 'id',
        reference: { selectionRectangles: [{ top: 40, page: '1' }], text: 'something' },
      })(dispatch);
      setTimeout(() => {
        expect(scroller.to).toHaveBeenCalledWith(
          '.document-viewer div#page-1',
          '.document-viewer',
          { duration: 1, dividerOffset: 1 }
        );

        expect(scroller.to).toHaveBeenCalledWith(
          '.document-viewer [data-id="id"] .highlight-rectangle',
          '.document-viewer',
          { duration: 50, offset: -30, dividerOffset: 1 }
        );
        done();
      });
    });
  });

  describe('selectReference()', () => {
    let dispatch;
    let references;

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      references = [{ _id: 'id1' }, { _id: 'id2', reference: 'range' }];
      actions.selectReference(references[1])(dispatch);
      dispatch.calls.argsFor(0)[0](dispatch);
    });

    it('should dispatch a call to activateReference', () => {
      expect(dispatch).toHaveBeenCalledWith({ type: types.ACTIVE_REFERENCE, reference: 'id2' });
      expect(dispatch).toHaveBeenCalledWith({ type: types.OPEN_PANEL, panel: 'viewMetadataPanel' });
    });

    it('should dispatch a SET_TARGET_SELECTION with found range', () => {
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_TARGET_SELECTION,
        targetRange: 'range',
      });
    });
  });

  describe('resetReferenceCreation()', () => {
    it('should RESET_REFERENCE_CREATION and unset targetDocument', () => {
      const dispatch = jasmine.createSpy('dispatch');
      actions.resetReferenceCreation()(dispatch);

      expect(dispatch).toHaveBeenCalledWith({ type: types.RESET_REFERENCE_CREATION });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/targetDoc/UNSET' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/targetDocHTML/UNSET' });
    });
  });

  describe('scrollToToc', () => {
    it('should scroll do the pageof the toc, with an offset to the toc position', async () => {
      spyOn(scroller, 'to').and.callFake(async () => Promise.resolve());
      await actions.scrollToToc({
        text: 'The hammer to fall',
        selectionRectangles: [
          {
            page: '1',
            top: 458,
            left: 127,
            height: 24,
            width: 289,
          },
        ],
      });

      expect(scroller.to).toHaveBeenLastCalledWith(
        '.document-viewer div#page-1',
        '.document-viewer',
        { dividerOffset: 1, duration: 1, force: true, offset: 458 }
      );
    });
  });

  describe('highlightSnippet', () => {
    it('should unmark all and mark snippets passed only once (only the ones for the pages being rendered)', () => {
      const container = document.createElement('div');
      let innerHTML = '<div class="document-viewer">unique ';
      innerHTML += '<div id="page-3">';
      innerHTML += 'snippet <span>marked</span> (with)  multiple spaces';
      innerHTML += 'snippet marked </br>new line';
      innerHTML += '</div>';
      innerHTML += '<div id="page-4">';
      innerHTML += 'page not in range 5';
      innerHTML += 'page not in range 6';
      innerHTML += 'page not in range 7';
      innerHTML += '</div>';
      innerHTML += '</div>';
      container.innerHTML = innerHTML;
      document.body.appendChild(container);
      Marker.init('div.main-wrapper');

      actions.highlightSnippet(
        Immutable.fromJS({ text: 'snippet <b>marked</b> (with) multiple spaces', page: 3 })
      );
      let marks = document.querySelectorAll('mark');
      expect(marks.length).toBe(4);
      expect(marks[0].innerHTML).toBe('snippet ');
      expect(marks[3].innerHTML).toBe(' (with)  multiple spaces');

      const searchTermMarks = document.querySelectorAll('mark.searchTerm');
      expect(searchTermMarks.length).toBe(1);

      actions.highlightSnippet(Immutable.fromJS({}));
      marks = document.querySelectorAll('mark');
      expect(marks.length).toBe(0);

      container.innerHTML = '';
    });
  });
});
