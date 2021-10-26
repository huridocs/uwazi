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

  it('should save the entity with attached files', async () => {
    const file = new File([Buffer.from('Hello World').toString('base64')], 'testFile.txt', {
      type: 'text/plain',
    });
    Object.assign(file, {
      on: () => {},
      pause: () => {},
      resume: () => {},
    });
    let serializedFile = new ArrayBuffer(0);
    await readFileAsBase64(file, info => {
      serializedFile = info;
    });

    const entity = {
      _id: 'entity1',
      title: 'entity1',
      attachments: [
        {
          _id: 'file1',
          serializedFile, //'data:text/plain;base64,SGVsbG8gV29ybGQh',
          originalname: 'file1',
        },
      ],
    };
    jest.clearAllMocks();
    //replace by generated from a file
    //const expectedFile = constructFile(entity.attachments[0]);
    const mockUpload = mockSuperAgent();
    const updatedEntity = await saveEntityWithFiles(entity);
    expect(mockUpload.attach).toHaveBeenCalledWith(
      'attachments[0]',
      expect.objectContaining({ size: 12 })
    );
    expect(updatedEntity).toEqual({ title: 'entity1' });
  });
});
