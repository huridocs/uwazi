import api from 'app/utils/api';
import { RequestParams } from './RequestParams';

async function dateToSeconds(dateString: string, locale?: string) {
  const requestParams = new RequestParams({ dateString, locale });
  const res = await api.post('date-to-seconds', requestParams);
  return res.json;
}

export { dateToSeconds };
