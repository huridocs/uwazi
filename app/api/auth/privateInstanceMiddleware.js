import settings from '../settings';

const allowedRoutes = ['login', 'setpassword/'];
const allowedRoutesMatch = new RegExp(allowedRoutes.join('|'));

const allowedApiCalls = ['/api/recoverpassword', '/api/resetpassword'];
const allowedApiMatch = new RegExp(allowedApiCalls.join('|'));

export default function (req, res, next) {
  if (req.user || req.url.match(allowedRoutesMatch)) {
    return next();
  }

  return settings.get()
  .then((result) => {
    if (result.private && req.url.match('/api/')) {
      if (req.url.match(allowedApiMatch)) {
        next();
        return;
      }

      res.status(401);
      res.json({ error: 'Unauthorized' });
      return;
    }

    if (result.private) {
      res.redirect('/login');
      return;
    }

    next();
  });
}
