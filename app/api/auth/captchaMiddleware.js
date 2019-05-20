export default function () {
  return (req, res, next) => {
    if (req.session && req.body && req.session.captcha === req.body.captcha) {
      delete req.body.captcha;
      return next();
    }
    res.status(403);
    return res.json({ error: 'Forbidden', message: 'Captcha error' });
  };
}
