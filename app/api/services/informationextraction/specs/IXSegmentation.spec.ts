import { ObjectId } from 'mongodb';
import { SegmentType } from '#segmentation';
import { IXSegmentation } from '../IXSegmentation.js';

const fileId = new ObjectId().toString();

const readModel = {
  fileId,
  filename: 'document.pdf',
  xmlFilename: 'document.xml',
  layout: {
    pages: [
      { number: 1, width: 612, height: 792 },
      { number: 2, width: 842, height: 595 },
    ],
    segments: [
      {
        left: 1,
        top: 2,
        width: 3,
        height: 4,
        pageNumber: 1,
        text: 'Heading',
        type: SegmentType.TITLE,
      },
      {
        left: 5,
        top: 6,
        width: 7,
        height: 8,
        pageNumber: 2,
        text: 'Item',
        type: SegmentType.LIST_ITEM,
      },
    ],
  },
};

describe('IXSegmentation', () => {
  it('should give IX the segmentation in the shape it sends to the extraction service', () => {
    expect(IXSegmentation.fromReadModel(readModel)).toEqual({
      fileID: new ObjectId(fileId),
      filename: 'document.pdf',
      xmlname: 'document.xml',
      status: 'ready',
      segmentation: {
        page_width: 612,
        page_height: 792,
        paragraphs: [
          { left: 1, top: 2, width: 3, height: 4, page_number: 1, text: 'Heading', type: 'Title' },
          { left: 5, top: 6, width: 7, height: 8, page_number: 2, text: 'Item', type: 'List item' },
        ],
      },
    });
  });

  it('should give a layout without pages a zero page size', () => {
    expect(
      IXSegmentation.fromReadModel({ ...readModel, layout: { pages: [], segments: [] } })
        .segmentation
    ).toEqual({ page_width: 0, page_height: 0, paragraphs: [] });
  });
});
