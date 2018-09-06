import handleError from './handleError';

export default function (error, req, res, next) {
  const handled = handleError(error);

  res.status(handled.code);
  res.json({ error: handled.message });

  next();
}
