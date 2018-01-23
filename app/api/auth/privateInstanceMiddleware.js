import settings from '../settings';

export default function (req, res, next) {
  return settings.get()
  .then((result) => {
    if (req.url.match('login')) {
      return next();
    }
    if (result.private && !req.user && req.url.match('/api/')) {
      res.status(401);
      res.json({error: 'Unauthorized'});
      return;
    }
    if (result.private && !req.user) {
      res.redirect('/login');
      return;
    }
    next();
  });
}
