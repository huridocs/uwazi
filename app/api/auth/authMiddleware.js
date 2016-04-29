export default function (req, res, next) {
  if (req.user) {
    return next();
  }
  res.status(401);
  res.json({error: 'Unauthorized'});
}
