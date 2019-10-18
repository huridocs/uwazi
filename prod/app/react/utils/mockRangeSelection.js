"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = mockRangeSelection;function mockRangeSelection(selectedText = '') {
  const range = {};

  range.range = 'range';
  range.getClientRects = () => [{ top: 100 }];

  window.getSelection = () => ({
    toString: () => selectedText,
    getRangeAt: () => range });


  return range;
}