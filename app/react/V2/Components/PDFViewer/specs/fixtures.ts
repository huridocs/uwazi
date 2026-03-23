import { PDFProps } from '../PDF';

const highlights: PDFProps['highlights'] = {
  2: [
    {
      key: '1',
      color: 'red',
      textSelection: {
        text: 'example',
        selectionRectangles: [{ left: 1, top: 2, width: 10, height: 5, regionId: 2 }],
      },
    },
  ],
  5: [
    {
      key: '3',
      textSelection: { selectionRectangles: [{ top: 20, width: 100, left: 0, height: 30 }] },
      color: 'blue',
    },
  ],
};

export { highlights };
