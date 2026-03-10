import api from 'app/utils/api';

const requestToken = async (): Promise<string> => {
  const { json } = await api.post('preserve');
  return json.token;
};

export { requestToken };
