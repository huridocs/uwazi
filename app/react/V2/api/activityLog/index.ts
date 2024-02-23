import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';

const get = async (
  searchParams: any,
  headers?: IncomingHttpHeaders
): Promise<{ rows: ActivityLogEntryType[]; remainingRows: number }> => {
  try {
    const requestParams = new RequestParams(searchParams, headers);
    const response = await api.get('activityLog', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { get };
