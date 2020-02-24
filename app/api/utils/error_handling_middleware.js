import handleError from './handleError';

export default function(error, req, res, next) {
  const handled = handleError(error, { req });

  const { message, code, ...rest } = handled;

  res.status(code);
  res.json({ error: message, ...rest });

  next();
}
