export default function mockRangeSelection(selectedText = '') {
  let range = {};

  range.range = 'range';
  range.getClientRects = () => {
    return [{top: 100}];
  };

  window.getSelection = () => {
    return {
      toString: () => {
        return selectedText;
      },
      getRangeAt: () => {
        return range;
      }
    };
  };

  return range;
}
