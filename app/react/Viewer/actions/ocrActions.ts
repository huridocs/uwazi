import { FileType } from 'shared/types/fileType';

const dummyOCRPost = (file: FileType) => file;

const dummyOCRGet = (filename: string) => {
  switch (filename) {
    case 'noOCR':
      return 'noOCR';

    case 'inQueue':
      return 'inQueue';

    case 'cannotProcess':
      return 'cannotProcess';

    case 'withOCR':
      return 'withOCR';

    default:
      return 'noOCR';
  }
};

export { dummyOCRPost, dummyOCRGet };
