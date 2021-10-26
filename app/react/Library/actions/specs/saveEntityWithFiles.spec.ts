/**
 * @jest-environment jsdom
 */
import superagent from 'superagent';
import { APIURL } from 'app/config';
import { readFileAsBase64, saveEntityWithFiles } from 'app/Library/actions/saveEntityWithFiles';

describe('saveEntityWithFiles', () => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const mockSuperAgent = (url = `${APIURL}entities_with_files`) => {
    const mockUpload = superagent.post(url);
    spyOn(mockUpload, 'field').and.returnValue(mockUpload);
    spyOn(mockUpload, 'attach').and.returnValue(mockUpload);

    jest.spyOn(mockUpload, 'end').mockImplementation(cb => {
      const response: Partial<superagent.Response> = { body: { title: 'entity1' } };
      cb?.(null, response as superagent.Response);
    });
    spyOn(superagent, 'post').and.returnValue(mockUpload);

    return mockUpload;
  };

  //longer content
  it.each`
    fileContent      | fileName        | fileType             | fileSize
    ${'Hello world'} | ${'text.txt'}   | ${'text/plain'}      | ${12}
    ${'Sample PDF'}  | ${'sample.pdf'} | ${'application/pdf'} | ${16}
  `(
    'should save the entity with attached files',
    async ({ fileContent, fileName, fileType, fileSize }) => {
      const file = new File([Buffer.from(fileContent).toString('base64')], fileName, {
        type: fileType,
      });

      let serializedFile = '';
      await readFileAsBase64(file, info => {
        serializedFile = info.toString();
      });

      const entity = {
        _id: 'entity1',
        title: 'entity1',
        attachments: [
          {
            _id: 'file1',
            serializedFile,
            originalname: fileName,
          },
        ],
      };

      const mockUpload = mockSuperAgent();

      const updatedEntity = await saveEntityWithFiles(entity);

      expect(mockUpload.attach).toHaveBeenCalledWith(
        'attachments[0]',
        expect.objectContaining({ size: fileSize, type: fileType })
      );

      expect(updatedEntity).toEqual({ title: 'entity1' });
    }
  );
});
