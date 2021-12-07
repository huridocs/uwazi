import settings from '../settings';

const allowedRoutes = ['login', 'setpassword/', 'unlockaccount/'];
const allowedRoutesMatch = new RegExp(allowedRoutes.join('|'));

const allowedApiCalls = [
  '/api/recoverpassword',
  '/api/resetpassword',
  '/api/unlockaccount',
  '/api/public',
];
const allowedApiMatch = new RegExp(allowedApiCalls.join('|'));

const forbiddenRoutes = ['/api/', '/uploaded_documents/'];
const forbiddenRoutesMatch = new RegExp(forbiddenRoutes.join('|'));

export default function (req, res, next) {
  if (req.user || req.url.match(allowedRoutesMatch)) {
    return next();
  }

  return settings
    .get()
    .then(result => {
      if (result.private && !req.url.match(allowedApiMatch)) {
        if (req.url.match(forbiddenRoutesMatch)) {
          res.status(401);
          res.json({ error: 'Unauthorized' });
          return;
        }

        res.redirect('/login');
        return;
      }

      next();
    })
    .catch(error => {
      next(error);
    });
}
