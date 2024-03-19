import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';

interface ActivityLogResponse {
  rows: ActivityLogEntryType[];
  remainingRows: number;
  limit: number;
  page: number;
  message: string;
}

const get = async (
  searchParams: any,
  headers?: IncomingHttpHeaders
): Promise<ActivityLogResponse> => {
  try {
    const requestParams = new RequestParams(searchParams, headers);
    const response = await api.get('activityLog', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export type { ActivityLogResponse };
export { get };
