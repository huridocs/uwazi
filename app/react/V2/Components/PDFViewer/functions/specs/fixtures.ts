const property1Selection = {
  name: 'property1',
  timestamp: 'time 1',
  propertyID: '1',
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
};

const property2Selection = {
  name: 'property2',
  propertyID: '2',
  timestamp: 'time 1',
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
};

const titleSelection = {
  name: 'title',
  timestamp: 'time 1',
  selection: {
    text: 'selection for title',
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
};

const selectionsFromFile = [property1Selection, property2Selection, titleSelection];

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

export { selectionsFromFile, selections, property1Selection, property2Selection, titleSelection };
