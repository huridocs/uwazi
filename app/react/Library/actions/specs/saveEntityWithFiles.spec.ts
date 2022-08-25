/**
 * @jest-environment jsdom
 */
import superagent from 'superagent';
import fetchMock from 'fetch-mock';

import { APIURL } from 'app/config';
import { readFileAsBase64, saveEntityWithFiles } from 'app/Library/actions/saveEntityWithFiles';
import { contentForFiles } from './fixtures';

describe('saveEntityWithFiles', () => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const mockSuperAgent = (url = `${APIURL}entities`) => {
    const mockUpload = superagent.post(url);
    spyOn(mockUpload, 'field').and.returnValue(mockUpload);
    spyOn(mockUpload, 'attach').and.returnValue(mockUpload);

    jest.spyOn(mockUpload, 'end').mockImplementation(cb => {
      const response: Partial<superagent.Response> = {
        body: { entity: { title: 'entity1', sharedId: 'entity1' } },
      };
      cb?.(null, response as superagent.Response);
    });
    spyOn(superagent, 'post').and.returnValue(mockUpload);

    return mockUpload;
  };

  const dispatch = jasmine.createSpy('dispatch');

  const mockedRevokeObjectURL: jest.Mock = jest.fn();
  beforeAll(() => {
    URL.revokeObjectURL = mockedRevokeObjectURL;
  });

  afterAll(() => {
    mockedRevokeObjectURL.mockReset();
  });

  it.each`
    fileContent              | fileName          | fileType                | fileSize
    ${contentForFiles.text}  | ${'text.txt'}     | ${'text/plain'}         | ${120}
    ${contentForFiles.text}  | ${'sample.pdf'}   | ${'application/pdf'}    | ${160}
    ${contentForFiles.image} | ${'image.jpg'}    | ${'image/jpg'}          | ${168}
    ${contentForFiles.text}  | ${'document.doc'} | ${'application/msword'} | ${160}
  `('should save the entity with attached files', async ({ fileContent, fileName, fileType }) => {
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
      sharedId: 'entity1',
      attachments: [
        {
          _id: 'file_id',
          serializedFile,
          originalname: fileName,
        },
        {
          _id: 'file2_id',
          originalname: 'existing file',
        },
      ],
    };

    const expectedEntityJson = JSON.stringify({
      _id: 'entity1',
      title: 'entity1',
      sharedId: 'entity1',
      attachments: [
        {
          _id: 'file_id',
          originalname: fileName,
        },
        {
          _id: 'file2_id',
          originalname: 'existing file',
        },
      ],
      documents: [],
    });

    const mockUpload = mockSuperAgent();

    const updatedEntity = await saveEntityWithFiles(entity, dispatch);

    expect(mockUpload.field).toHaveBeenCalledWith('entity', expectedEntityJson);
    expect(mockUpload.attach).toHaveBeenCalledWith('attachments[0]', file);
    expect(mockUpload.field).toHaveBeenCalledWith('attachments_originalname[0]', fileName);
    expect(updatedEntity).toEqual({ entity: { sharedId: 'entity1', title: 'entity1' } });
  });

  it('should save the entity without files', async () => {
    const entity = {
      _id: 'entity1',
      title: 'entity1',
      sharedId: 'entity1',
      metadata: { data: [{ value: 'string' }] },
      documents: [],
    };

    const mockUpload = mockSuperAgent();
    const updatedEntity = await saveEntityWithFiles(entity, dispatch);

    expect(mockUpload.field).toHaveBeenLastCalledWith('entity', JSON.stringify(entity));

    expect(updatedEntity).toEqual({ entity: { sharedId: 'entity1', title: 'entity1' } });
  });

  it('should save the entity with added documents', async () => {
    const file = new File([Buffer.from('pdf').toString('base64')], 'document.pdf', {
      type: 'application/pdf',
    });

    const entity = {
      _id: 'entity1',
      sharedId: 'entity1',
      title: 'entity1',
      attachments: [],
      documents: [{ data: 'blob:http://localhost:3000/blob/file_id', originalFile: file }],
    };

    const expectedEntityJson = JSON.stringify({
      _id: 'entity1',
      sharedId: 'entity1',
      title: 'entity1',
      attachments: [],
      documents: [],
    });

    const mockUpload = mockSuperAgent();
    fetchMock.mock('blob:http://localhost:3000/blob/file_id', { blob: {} });
    const updatedEntity = await saveEntityWithFiles(entity, dispatch);
    expect(mockUpload.attach).toHaveBeenCalledWith('documents[0]', file);
    expect(mockUpload.field).toHaveBeenCalledWith('entity', expectedEntityJson);
    expect(mockUpload.field).toHaveBeenCalledWith('documents_originalname[0]', file.name);
    expect(updatedEntity).toEqual({ entity: { sharedId: 'entity1', title: 'entity1' } });
  });
});
