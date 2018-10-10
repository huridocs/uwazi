import handleError from './handleError';

export default function (error, req, res, next) {
  const handled = handleError(error, { req });

  res.status(handled.code);
  res.json({ error: handled.message });

  next();
}
