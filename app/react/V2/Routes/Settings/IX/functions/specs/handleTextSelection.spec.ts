import { highlightsForProperty } from '../handleTextSelection';

const selections = [
  {
    name: 'property1',
    selection: {
      text: 'selection text 1',
      selectionRectangles: [
        {
          top: 1,
          left: 1,
          width: 1,
          height: 1,
          page: '1',
        },
      ],
    },
  },
  {
    name: 'property2',
    selection: {
      text: 'a long text spanning several pages',
      selectionRectangles: [
        {
          top: 2,
          left: 2,
          width: 2,
          height: 2,
          page: '1',
        },
        {
          top: 3,
          left: 3,
          width: 3,
          height: 3,
          page: '1',
        },
        {
          top: 1,
          left: 1,
          width: 1,
          height: 1,
          page: '3',
        },
        {
          top: 2,
          left: 2,
          width: 2,
          height: 2,
          page: '3',
        },
        {
          top: 5,
          left: 5,
          width: 5,
          height: 5,
          page: '4',
        },
      ],
    },
  },
];

describe('PDF selections handlers', () => {
  describe('highlights for a property', () => {
    it('should filter the selections by the property and format it correctly', () => {
      const results = highlightsForProperty(selections, 'property1');
      expect(results).toEqual({
        1: [
          {
            textSelection: {
              text: selections[0].selection.text,
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
            color: '#B1F7A3',
            key: '1',
          },
        ],
      });
    });

    it('should organize selections by page', () => {
      const results = highlightsForProperty(selections, 'property2');

      expect(results).toEqual({
        1: [
          {
            color: '#B1F7A3',
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
            color: '#B1F7A3',
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
            color: '#B1F7A3',
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
