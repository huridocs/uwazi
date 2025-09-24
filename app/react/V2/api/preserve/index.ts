// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';

const requestToken = async (): Promise<string> => {
  const { json } = await api.post('preserve');
  return json.token;
};

export { requestToken };
