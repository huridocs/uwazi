import api from 'app/utils/api';

const getLanguages = async () => {
  const { json: response } = await api.get('languages');
  return response;
};

export { getLanguages };
