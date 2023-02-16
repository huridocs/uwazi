import { I18NApi } from 'app/I18N';

const get = (request: Request) => {
  const response = I18NApi.get(request);
  return response;
};

export { get };
