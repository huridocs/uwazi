export default function mockRangeSelection(selectedText = '', start = 1, end = 3) {
  let range = document.createRange();
  range.setStart(document.body, start);
  range.setEnd(document.body, end);

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
