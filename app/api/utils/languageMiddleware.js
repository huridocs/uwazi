export default function (req, res, next) {
  req.language = req.get('content-language');
  if (!req.language) {
    req.language = 'es';
  }

  next();
}
