import { FileType } from 'shared/types/fileType';

const dummyOCRPost = (file: FileType) => file;

const dummyOCRGet = async (filename: string) => {
  let response = '';

  switch (filename) {
    case 'noOCR':
      response = 'noOCR';
      break;

    case 'inQueue':
      response = 'inQueue';
      break;

    case 'cannotProcess':
      response = 'cannotProcess';
      break;

    case 'withOCR':
      response = 'withOCR';
      break;

    default:
      response = 'cannotProcess';
      break;
  }

  return response;
};

export { dummyOCRPost, dummyOCRGet };
