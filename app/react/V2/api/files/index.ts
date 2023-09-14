import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { FileType } from 'shared/types/fileType';

const getById = async (_id: string): Promise<FileType[]> => {
  try {
    const requestParams = new RequestParams({ _id });
    const { json: response } = await api.get('files', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

export { getById };