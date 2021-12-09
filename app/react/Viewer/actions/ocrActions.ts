import api from 'app/utils/api';

const postToOcr = async (filename: string) => {
  await api.post(`files/${filename}/ocr`);
};

const getOcrStatus = async (filename: string) => {
  const {
    json: { status },
  } = await api.get(`files/${filename}/ocr`);

  return status;
};

export { postToOcr, getOcrStatus };
