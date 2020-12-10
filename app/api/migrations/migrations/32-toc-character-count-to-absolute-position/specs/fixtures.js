import testingDB from 'api/utils/testing_db';

const documentWithTocId = testingDB.id();
const documentWithoutTocId = testingDB.id();
const documentWithVoidTocId = testingDB.id();
const documentWithoutPdfInfoId = testingDB.id();

export default {
  files: [
    {
      _id: documentWithTocId,
      filename: 'test.pdf',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
      toc: [
        {
          range: {
            start: 207,
            end: 227,
          },
          label: 'PUBLISH WITH PURPOSE',
          indentation: 0,
        },
        {
          range: {
            start: 327,
            end: 349,
          },
          label: 'BUILD A CUSTOM LIBRARY',
          indentation: 1,
        },
        {
          range: {
            start: 476,
            end: 500,
          },
          label: 'DISCOVER NEW INFORMATION',
          indentation: 2,
        },
      ],
    },
    {
      _id: documentWithoutTocId,
      filename: 'test.pdf',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
    },
    {
      _id: documentWithVoidTocId,
      filename: 'test.pdf',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
      toc: [],
    },
    {
      _id: documentWithoutPdfInfoId,
      filename: 'test.pdf',
      pdfInfo: null,
      toc: [
        {
          range: {
            start: 207,
            end: 227,
          },
          label: 'PUBLISH WITH PURPOSE',
          indentation: 0,
        },
        {
          range: {
            start: 327,
            end: 349,
          },
          label: 'BUILD A CUSTOM LIBRARY',
          indentation: 1,
        },
        {
          range: {
            start: 476,
            end: 500,
          },
          label: 'DISCOVER NEW INFORMATION',
          indentation: 2,
        },
      ],
    }
  ],
};

export { documentWithTocId, documentWithVoidTocId, documentWithoutPdfInfoId };
