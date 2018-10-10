import handleError from './handleError';

export default function (error, req, res, next) {
  // error.url = req.originalurl;
  // error.body = req.body;
  // error.query = req.query;
  const handled = handleError(error, { req });

  res.status(handled.code);
  res.json({ error: handled.message });

  next();
}
