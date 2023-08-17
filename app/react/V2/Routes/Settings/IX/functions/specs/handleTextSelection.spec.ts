import { getHighlightsFromFile, getHighlightsFromSelection } from '../handleTextSelection';
import { selectionsFromFile, selections } from './fixtures';

describe('PDF selections handlers', () => {
  describe('highlights from text selection', () => {
    it('should format the selection as a highligh', () => {
      const result = getHighlightsFromSelection(selections[0]);
      expect(result).toEqual({
        1: [
          {
            textSelection: {
              text: 'selection 1',
              selectionRectangles: [
                {
                  height: 1,
                  left: 1,
                  top: 1,
                  width: 1,
                  regionId: '1',
                },
              ],
            },
            color: 'lightyellow',
            key: '1',
          },
        ],
      });
    });

    it('should organize it by page', () => {
      const result = getHighlightsFromSelection(selections[1]);
      expect(result).toEqual({
        1: [
          {
            textSelection: {
              text: 'selection 2 in multiple pages',
              selectionRectangles: [
                {
                  left: 1,
                  top: 1,
                  width: 1,
                  height: 1,
                  regionId: '1',
                },
                {
                  left: 2,
                  top: 2,
                  width: 2,
                  height: 2,
                  regionId: '1',
                },
              ],
            },
            color: 'lightyellow',
            key: '1',
          },
        ],
        2: [
          {
            textSelection: {
              text: 'selection 2 in multiple pages',
              selectionRectangles: [
                {
                  left: 1,
                  top: 1,
                  width: 1,
                  height: 1,
                  regionId: '2',
                },
                {
                  left: 2,
                  top: 2,
                  width: 2,
                  height: 2,
                  regionId: '2',
                },
              ],
            },
            color: 'lightyellow',
            key: '2',
          },
        ],
        3: [
          {
            textSelection: {
              text: 'selection 2 in multiple pages',
              selectionRectangles: [
                {
                  left: 1,
                  top: 1,
                  width: 1,
                  height: 1,
                  regionId: '3',
                },
              ],
            },
            color: 'lightyellow',
            key: '3',
          },
        ],
      });
    });
  });

  describe('highlights from file extracted metadata', () => {
    it('should filter the selections by the property and format it correctly', () => {
      const results = getHighlightsFromFile(selectionsFromFile, 'property1');
      expect(results).toEqual({
        1: [
          {
            textSelection: {
              text: 'selection text 1',
              selectionRectangles: [
                {
                  height: 1,
                  left: 1,
                  regionId: '1',
                  top: 1,
                  width: 1,
                },
              ],
            },
            color: 'lightyellow',
            key: '1',
          },
        ],
      });
    });

    it('should organize selections by page', () => {
      const results = getHighlightsFromFile(selectionsFromFile, 'property2');

      expect(results).toEqual({
        1: [
          {
            color: 'lightyellow',
            key: '1',
            textSelection: {
              text: 'a long text spanning several pages',
              selectionRectangles: [
                {
                  top: 2,
                  left: 2,
                  width: 2,
                  height: 2,
                  regionId: '1',
                },
                {
                  top: 3,
                  left: 3,
                  width: 3,
                  height: 3,
                  regionId: '1',
                },
              ],
            },
          },
        ],
        3: [
          {
            color: 'lightyellow',
            key: '3',
            textSelection: {
              text: 'a long text spanning several pages',
              selectionRectangles: [
                {
                  top: 1,
                  left: 1,
                  width: 1,
                  height: 1,
                  regionId: '3',
                },
                {
                  top: 2,
                  left: 2,
                  width: 2,
                  height: 2,
                  regionId: '3',
                },
              ],
            },
          },
        ],
        4: [
          {
            color: 'lightyellow',
            key: '4',
            textSelection: {
              text: 'a long text spanning several pages',
              selectionRectangles: [
                {
                  top: 5,
                  left: 5,
                  width: 5,
                  height: 5,
                  regionId: '4',
                },
              ],
            },
          },
        ],
      });
    });
  });
});
