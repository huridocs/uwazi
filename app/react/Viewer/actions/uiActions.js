import { actions } from 'app/BasicReducer';
import { events } from 'app/utils';
import { setTargetSelection } from 'app/Viewer/actions/selectionActions';
import Marker from 'app/Viewer/utils/Marker.js';
import scroller from 'app/Viewer/utils/Scroller';
import * as types from 'app/Viewer/actions/actionTypes';

export function closePanel() {
  return {
    type: types.CLOSE_PANEL,
  };
}

export function openPanel(panel) {
  return {
    type: types.OPEN_PANEL,
    panel,
  };
}

export function resetReferenceCreation() {
  return function(dispatch) {
    dispatch({ type: types.RESET_REFERENCE_CREATION });
    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocHTML'));
    dispatch(actions.unset('viewer/targetDocReferences'));
  };
}

export function selectTargetDocument(id) {
  return {
    type: types.SELECT_TARGET_DOCUMENT,
    id,
  };
}

export function highlightReference(reference) {
  return {
    type: types.HIGHLIGHT_REFERENCE,
    reference,
  };
}

export function deactivateReference() {
  return {
    type: types.DEACTIVATE_REFERENCE,
  };
}

export function goToActive(value = true) {
  return {
    type: types.GO_TO_ACTIVE,
    value,
  };
}

export function highlightSnippet(snippet) {
  Marker.init('.document-viewer');
  Marker.unmark();
  const text = snippet.get('text');
  if (!text) {
    return;
  }

  const textToMatcherRegExp = _text =>
    _text
      .replace(/…/g, '...')
      .replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, '\\s*')
      .replace(/\n/g, '\\s*');

  const rawMatches = text.match(/<b>(.|\n)*?<\/b>/g);
  const matches = rawMatches ? rawMatches.map(m => m.replace(/<.*?>/g, '')) : [];
  const highlight = textToMatcherRegExp(text);

  const markSearchTerm = () => {
    Marker.init('mark');
    Marker.mark(matches, {
      className: 'searchTerm',
      diacritics: false,
      acrossElements: false,
      separateWordSearch: true,
      accuracy: 'exactly',
    });
  };

  const tryFuzziMark = (chunkLenght = 20) => {
    if (!chunkLenght) {
      return;
    }
    const startOfText = textToMatcherRegExp(text.substring(0, chunkLenght));
    const endOfText = textToMatcherRegExp(
      text.substring(text.length - chunkLenght - 1, text.length - 1)
    );
    const fuzziText = `${startOfText}.{1,200}${endOfText}`;
    const regexp = new RegExp(fuzziText);
    Marker.markRegExp(regexp, {
      separateWordSearch: false,
      acrossElements: true,
      done: markSearchTerm,
      noMatch: tryFuzziMark.bind(this, chunkLenght - 5),
    });
  };

  const regexp = new RegExp(highlight);
  Marker.markRegExp(regexp, {
    separateWordSearch: false,
    acrossElements: true,
    done: markSearchTerm,
    noMatch: tryFuzziMark.bind(this, 20),
  });
}

export function scrollToPage(page, duration = 50) {
  scroller.to(`.document-viewer div#page-${page}`, '.document-viewer', {
    duration,
    dividerOffset: 1,
    offset: 50,
  });
}

export function scrollTomark() {
  scroller.to('.document-viewer mark', '.document-viewer', { duration: 0 });
}

export function scrollTo(reference, docInfo, element = 'a') {
  const page = Object.keys(docInfo).find(
    pageNumber => docInfo[pageNumber].chars >= reference.range.start
  );
  if (
    window.document.querySelector(
      `.document-viewer ${element}[data-${reference._id}="${reference._id}"]`,
      '.document-viewer'
    )
  ) {
    scroller.to(
      `.document-viewer ${element}[data-${reference._id}="${reference._id}"]`,
      '.document-viewer',
      { duration: 50 }
    );
  } else {
    const scroll = scroller.to(`.document-viewer div#page-${page}`, '.document-viewer', {
      duration: 0,
      dividerOffset: 1,
    });

    events.on('referenceRendered', renderedReference => {
      if (
        renderedReference.ids.includes(reference._id) &&
        window.document.querySelector(
          `.document-viewer ${element}[data-${reference._id}="${reference._id}"]`,
          '.document-viewer'
        )
      ) {
        window.clearInterval(scroll);
        scroller.to(
          `.document-viewer ${element}[data-${reference._id}="${reference._id}"]`,
          '.document-viewer',
          { duration: 50 }
        );
        events.removeAllListeners('referenceRendered');
      }
    });
  }
  scroller.to(`.metadata-sidepanel .item-${reference._id}`, '.metadata-sidepanel .sidepanel-body', {
    duration: 50,
  });
}

export function selectSnippet(page, snippet) {
  scrollToPage(page);
  setTimeout(() => {
    scrollTomark();
  }, 500);
  return dispatch => {
    dispatch({ type: types.SELECT_SNIPPET, snippet });
  };
}

export function activateReference(reference, docInfo, tab, delayActivation = false) {
  const tabName = tab && !Array.isArray(tab) ? tab : 'references';
  events.removeAllListeners('referenceRendered');

  return dispatch => {
    dispatch({ type: types.ACTIVE_REFERENCE, reference: reference._id });
    if (delayActivation) {
      dispatch(goToActive());
    }
    dispatch({ type: types.OPEN_PANEL, panel: 'viewMetadataPanel' });
    dispatch(actions.set('viewer.sidepanel.tab', tabName));
    if (!delayActivation) {
      setTimeout(() => {
        scrollTo(reference, docInfo);
      });
    }
  };
}

export function scrollToActive(reference, docInfo, tab, doScroll) {
  return dispatch => {
    if (doScroll) {
      dispatch(goToActive(false));
      dispatch(activateReference(reference, docInfo, tab));
    }
  };
}

export function selectReference(reference, docInfo) {
  return dispatch => {
    dispatch(activateReference(reference, docInfo));
    dispatch(setTargetSelection(reference.range));
  };
}
