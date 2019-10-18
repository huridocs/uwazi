"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.closePanel = closePanel;exports.openPanel = openPanel;exports.resetReferenceCreation = resetReferenceCreation;exports.selectTargetDocument = selectTargetDocument;exports.highlightReference = highlightReference;exports.deactivateReference = deactivateReference;exports.goToActive = goToActive;exports.highlightSnippet = highlightSnippet;exports.scrollToPage = scrollToPage;exports.scrollTomark = scrollTomark;exports.scrollTo = scrollTo;exports.selectSnippet = selectSnippet;exports.activateReference = activateReference;exports.scrollToActive = scrollToActive;exports.selectReference = selectReference;var _BasicReducer = require("../../BasicReducer");
var _utils = require("../../utils");
var _selectionActions = require("./selectionActions");
var _Marker = _interopRequireDefault(require("../utils/Marker.js"));
var _Scroller = _interopRequireDefault(require("../utils/Scroller"));
var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function closePanel() {
  return {
    type: types.CLOSE_PANEL };

}

function openPanel(panel) {
  return {
    type: types.OPEN_PANEL,
    panel };

}

function resetReferenceCreation() {
  return function (dispatch) {
    dispatch({ type: types.RESET_REFERENCE_CREATION });
    dispatch(_BasicReducer.actions.unset('viewer/targetDoc'));
    dispatch(_BasicReducer.actions.unset('viewer/targetDocHTML'));
    dispatch(_BasicReducer.actions.unset('viewer/targetDocReferences'));
  };
}

function selectTargetDocument(id) {
  return {
    type: types.SELECT_TARGET_DOCUMENT,
    id };

}

function highlightReference(reference) {
  return {
    type: types.HIGHLIGHT_REFERENCE,
    reference };

}

function deactivateReference() {
  return {
    type: types.DEACTIVATE_REFERENCE };

}

function goToActive(value = true) {
  return {
    type: types.GO_TO_ACTIVE,
    value };

}

function highlightSnippet(snippet) {
  _Marker.default.init('.document-viewer');
  _Marker.default.unmark();
  const text = snippet.get('text');
  if (!text) {
    return;
  }

  const textToMatcherRegExp = _text => _text.
  replace(/…/g, '...').
  replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').
  replace(/<[^>]*>/g, '').
  replace(/\s+/g, '\\s*').
  replace(/\n/g, '\\s*');

  const rawMatches = text.match(/<b>(.|\n)*?<\/b>/g);
  const matches = rawMatches ? rawMatches.map(m => m.replace(/<.*?>/g, '')) : [];
  const highlight = textToMatcherRegExp(text);

  const markSearchTerm = () => {
    _Marker.default.init('mark');
    _Marker.default.mark(matches, { className: 'searchTerm', diacritics: false, acrossElements: false, separateWordSearch: true, accuracy: 'exactly' });
  };

  const tryFuzziMark = (chunkLenght = 20) => {
    if (!chunkLenght) {
      return;
    }
    const startOfText = textToMatcherRegExp(text.substring(0, chunkLenght));
    const endOfText = textToMatcherRegExp(text.substring(text.length - chunkLenght - 1, text.length - 1));
    const fuzziText = `${startOfText}.{1,200}${endOfText}`;
    const regexp = new RegExp(fuzziText);
    _Marker.default.markRegExp(regexp, {
      separateWordSearch: false,
      acrossElements: true,
      done: markSearchTerm,
      noMatch: tryFuzziMark.bind(this, chunkLenght - 5) });

  };

  const regexp = new RegExp(highlight);
  _Marker.default.markRegExp(regexp, {
    separateWordSearch: false,
    acrossElements: true,
    done: markSearchTerm,
    noMatch: tryFuzziMark.bind(this, 20) });

}

function scrollToPage(page, duration = 50) {
  _Scroller.default.to(`.document-viewer div#page-${page}`, '.document-viewer', { duration, dividerOffset: 1, offset: 50 });
}

function scrollTomark() {
  _Scroller.default.to('.document-viewer mark', '.document-viewer', { duration: 0 });
}

function scrollTo(reference, docInfo, element = 'a') {
  const page = Object.keys(docInfo).find(pageNumber => docInfo[pageNumber].chars >= reference.range.start);
  if (window.document.querySelector(`.document-viewer ${element}[data-${reference._id}="${reference._id}"]`, '.document-viewer')) {
    _Scroller.default.to(`.document-viewer ${element}[data-${reference._id}="${reference._id}"]`, '.document-viewer', { duration: 50 });
  } else {
    const scroll = _Scroller.default.to(`.document-viewer div#page-${page}`, '.document-viewer', { duration: 0, dividerOffset: 1 });

    _utils.events.on('referenceRendered', renderedReference => {
      if (renderedReference.ids.includes(reference._id) &&
      window.document.querySelector(`.document-viewer ${element}[data-${reference._id}="${reference._id}"]`, '.document-viewer'))
      {
        window.clearInterval(scroll);
        _Scroller.default.to(`.document-viewer ${element}[data-${reference._id}="${reference._id}"]`, '.document-viewer', { duration: 50 });
        _utils.events.removeAllListeners('referenceRendered');
      }
    });
  }
  _Scroller.default.to(`.metadata-sidepanel .item-${reference._id}`, '.metadata-sidepanel .sidepanel-body', { duration: 50 });
}

function selectSnippet(page, snippet) {
  scrollToPage(page);
  setTimeout(() => {scrollTomark();}, 500);
  return dispatch => {
    dispatch({ type: types.SELECT_SNIPPET, snippet });
  };
}

function activateReference(reference, docInfo, tab, delayActivation = false) {
  const tabName = tab && !Array.isArray(tab) ? tab : 'references';
  _utils.events.removeAllListeners('referenceRendered');

  return dispatch => {
    dispatch({ type: types.ACTIVE_REFERENCE, reference: reference._id });
    if (delayActivation) {
      dispatch(goToActive());
    }
    dispatch({ type: types.OPEN_PANEL, panel: 'viewMetadataPanel' });
    dispatch(_BasicReducer.actions.set('viewer.sidepanel.tab', tabName));
    if (!delayActivation) {
      setTimeout(() => {
        scrollTo(reference, docInfo);
      });
    }
  };
}

function scrollToActive(reference, docInfo, tab, doScroll) {
  return dispatch => {
    if (doScroll) {
      dispatch(goToActive(false));
      dispatch(activateReference(reference, docInfo, tab));
    }
  };
}


function selectReference(reference, docInfo) {
  return dispatch => {
    dispatch(activateReference(reference, docInfo));
    dispatch((0, _selectionActions.setTargetSelection)(reference.range));
  };
}