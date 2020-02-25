export default function mockRangeSelection(selectedText = '') {
  const range = {};

  range.range = 'range';
  range.getClientRects = () => [{ top: 100 }];

  window.getSelection = () => ({
    toString: () => selectedText,
    getRangeAt: () => range,
  });

  return range;
}
