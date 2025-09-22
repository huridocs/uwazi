import api from '../../utils/api.js';

const requestToken = async (): Promise<string> => {
  const { json } = await api.post('preserve');
  return json.token;
};

export { requestToken };
