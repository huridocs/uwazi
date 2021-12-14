import api from 'app/utils/api';

const postToOcr = async (filename: string) => {
  await api.post(`files/${filename}/ocr`);
};

const getOcrStatus = async (filename: string) => {
  const {
    json: { status, lastUpdated },
  } = await api.get(`files/${filename}/ocr`);

  return { status, lastUpdated };
};

export { postToOcr, getOcrStatus };
