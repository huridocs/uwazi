import { handleError } from './handleError';

export default (error, req, res, next) => {
  const { message, prettyMessage, code, ...rest } = handleError(error, { req });

  res.status(code);
  res.json({ error: prettyMessage || message, ...rest });

  next();
};
