import { formatBytes, getFileNameAndExtension } from '../formatHelpers';

describe('Formatting helpers', () => {
  describe('bytes formatter', () => {
    it.each`
      bytes        | result
      ${0}         | ${'0 Bytes'}
      ${null}      | ${'0 Bytes'}
      ${undefined} | ${'0 Bytes'}
      ${3382316}   | ${'3.23 MB'}
      ${45819944}  | ${'43.7 MB'}
      ${275289508} | ${'262.54 MB'}
    `('should return a formatted date', ({ bytes, result }) => {
      expect(formatBytes(bytes)).toEqual(result);
    });
  });

  describe('get filename and extension', () => {
    it.each`
      filename                         | expectedName                 | expectedExtension
      ${'кириллическое_имя.файла.png'} | ${'кириллическое_имя.файла'} | ${'png'}
      ${'example_file.txt'}            | ${'example_file'}            | ${'txt'}
      ${'image.jpeg'}                  | ${'image'}                   | ${'jpeg'}
      ${'data.tar.gz'}                 | ${'data.tar'}                | ${'gz'}
      ${'script.min.js'}               | ${'script.min'}              | ${'js'}
      ${'اسم_الملف.نص.txt'}            | ${'اسم_الملف.نص'}            | ${'txt'}
      ${'file with spaces.docx'}       | ${'file with spaces'}        | ${'docx'}
      ${'!@#$%^&*()_+}{":?><.txt'}     | ${'!@#$%^&*()_+}{":?><'}     | ${'txt'}
    `(
      'returns name and extension for $filename',
      ({ filename, expectedName, expectedExtension }) => {
        const { name, extension } = getFileNameAndExtension(filename);
        expect(name).toEqual(expectedName);
        expect(extension).toEqual(expectedExtension);
      }
    );
  });
});
