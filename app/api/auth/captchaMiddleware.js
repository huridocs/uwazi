export default function() {
  return (req, res, next) => {
    const captchaInTheBody = req.body && req.body.captcha;
    if (req.session && captchaInTheBody && req.session.captcha === req.body.captcha) {
      delete req.body.captcha;
      return next();
    }
    res.status(403);
    return res.json({ error: 'Captcha error', message: 'Forbidden' });
  };
}
