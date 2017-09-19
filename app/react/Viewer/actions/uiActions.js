import * as types from 'app/Viewer/actions/actionTypes';
import {actions} from 'app/BasicReducer';
import scroller from 'app/Viewer/utils/Scroller';
import {setTargetSelection} from 'app/Viewer/actions/selectionActions';
import {events} from 'app/utils';
import Marker from 'app/Viewer/utils/Marker.js';

export function closePanel() {
  return {
    type: types.CLOSE_PANEL
  };
}

export function openPanel(panel) {
  return {
    type: types.OPEN_PANEL,
    panel
  };
}

export function resetReferenceCreation() {
  return function (dispatch) {
    dispatch({type: types.RESET_REFERENCE_CREATION});
    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocHTML'));
    dispatch(actions.unset('viewer/targetDocReferences'));
  };
}

export function selectTargetDocument(id) {
  return {
    type: types.SELECT_TARGET_DOCUMENT,
    id
  };
}

export function highlightReference(reference) {
  return {
    type: types.HIGHLIGHT_REFERENCE,
    reference
  };
}

export function deactivateReference() {
  return {
    type: types.DEACTIVATE_REFERENCE
  };
}

export function goToActive(value = true) {
  return {
    type: types.GO_TO_ACTIVE,
    value
  };
}

export function highlightSnippets(snippets, pagesBeingRendered = []) {
  let highlights = snippets
  .filter((s) => pagesBeingRendered.includes(s.get('page')))
  .map((snippet) => {
    return snippet.get('text')
    .replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, '\\s*')
    .replace(/\n/g, '\\s*');
  })
  .filter((elem, pos, arr) => {
    return arr.indexOf(elem) === pos;
  });

  Marker.unmark();
  highlights.forEach((highlightRegExp) => {
    let regexp = new RegExp(highlightRegExp);
    Marker.markRegExp(regexp, {separateWordSearch: false, acrossElements: true});
  });
}

export function scrollToPage(page) {
  scroller.to(`.document-viewer div#page-${page}`, '.document-viewer', {duration: 100, dividerOffset: 1});
}

export function scrollTo(reference, docInfo, element = 'a') {
  //
  let page = Object.keys(docInfo).find((pageNumber) => {
    return docInfo[pageNumber].chars >= reference.range.start;
  });
  //

  if (document.querySelector(`.document-viewer ${element}[data-id="${reference._id}"]`, '.document-viewer')) {
    scroller.to(`.document-viewer a[data-id="${reference._id}"]`, '.document-viewer', {duration: 100});
  } else {
    let scroll = scroller.to(`.document-viewer div#page-${page}`, '.document-viewer', {duration: 0, dividerOffset: 1});

    events.on('referenceRendered', (renderedReference) => {
      if (renderedReference._id === reference._id &&
          document.querySelector(`.document-viewer ${element}[data-id="${reference._id}"]`, '.document-viewer')
         ) {
        window.clearInterval(scroll);
        scroller.to(`.document-viewer ${element}[data-id="${reference._id}"]`, '.document-viewer', {duration: 100});
        events.removeAllListeners('referenceRendered');
      }
    });
  }

  scroller.to(`.metadata-sidepanel .item-${reference._id}`, '.metadata-sidepanel .sidepanel-body', {duration: 100});
}

export function activateReference(reference, docInfo, tab) {
  const tabName = tab && !Array.isArray(tab) ? tab : 'references';
  events.removeAllListeners('referenceRendered');

  return function (dispatch) {
    dispatch({type: types.ACTIVE_REFERENCE, reference: reference._id});
    dispatch({type: types.OPEN_PANEL, panel: 'viewMetadataPanel'});
    dispatch(actions.set('viewer.sidepanel.tab', tabName));

    setTimeout(() => {
      scrollTo(reference, docInfo);
    });
  };
}

export function scrollToActive(reference, docInfo, tab, doScroll) {
  return function (dispatch) {
    if (doScroll) {
      dispatch(goToActive(false));
      dispatch(activateReference(reference, docInfo, tab));
    }
  };
}


export function selectReference(reference, docInfo) {
  return function (dispatch) {
    dispatch(activateReference(reference, docInfo));
    dispatch(setTargetSelection(reference.range));
  };
}
