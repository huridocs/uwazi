import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/activityLog... Remove this comment to see the full error message
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType.js';

interface ActivityLogResponse {
  rows: ActivityLogEntryType[];
  remainingRows: number;
  totalRows: number;
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
