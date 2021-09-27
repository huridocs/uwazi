import { handleError } from './handleError';

export default (error, req, res, next) => {
  const { message, code, ...rest } = handleError(error, { req });

  res.status(code);
  res.json({ error: message, ...rest });

  next();
};
