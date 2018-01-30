import settings from '../settings';

export default function (req, res, next) {
  if (req.user || req.url.match('login')) {
    return next();
  }

  return settings.get()
  .then((result) => {
    if (result.private && req.url.match('/api/')) {
      res.status(401);
      res.json({error: 'Unauthorized'});
      return;
    }
    if (result.private) {
      res.redirect('/login');
      return;
    }
    next();
  });
}
