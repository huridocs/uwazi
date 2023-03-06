import { I18NApi } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';

const get = (request: Request): ClientTranslationSchema[] => {
  const response = I18NApi.get(request);
  return response;
};

export { get };
