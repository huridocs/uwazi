/**
 * @jest-environment jsdom
 */
import superagent from 'superagent';
import { APIURL } from 'app/config';
import { constructFile, saveEntityWithFiles } from 'app/Library/actions/saveEntityWithFiles';

describe('saveEntityWithFiles', () => {
  const mockSuperAgent = (url = `${APIURL}entities_with_files`) => {
    const mockUpload = superagent.post(url);

    spyOn(mockUpload, 'field').and.returnValue(mockUpload);
    spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
    const response = { body: { title: 'entity1' } };
    jest.spyOn(mockUpload, 'end').mockImplementation(cb => {
      cb(null, response);
      return mockUpload;
    });
    spyOn(superagent, 'post').and.returnValue(mockUpload);

    return mockUpload;
  };

  it('should save the entity with attached files', async () => {
    const entity = {
      _id: 'entity1',
      title: 'entity1',
      attachments: [
        {
          _id: 'file1',
          serializedFile: 'data:text/plain;base64,SGVsbG8gV29ybGQh',
          originalname: 'file1',
        },
      ],
    };
    jest.clearAllMocks();
    //replace by generated from a file
    const expectedFile = constructFile(entity.attachments[0]);

    const mockUpload = mockSuperAgent();
    const updatedEntity = await saveEntityWithFiles(entity);
    expect(mockUpload.attach).toHaveBeenCalledWith('attachments[0]', expectedFile);
    expect(updatedEntity).toEqual({ title: 'entity1' });
  });
});
