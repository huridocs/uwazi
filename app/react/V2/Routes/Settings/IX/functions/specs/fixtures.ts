const selectionsFromFile = [
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

const selections = [
  {
    text: 'selection 1',
    selectionRectangles: [
      {
        left: 1,
        top: 1,
        width: 1,
        height: 1,
        regionId: '1',
      },
    ],
  },
  {
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
      {
        left: 1,
        top: 1,
        width: 1,
        height: 1,
        regionId: '3',
      },
    ],
  },
];

export { selectionsFromFile, selections };
