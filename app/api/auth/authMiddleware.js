export default function (roles = ['admin']) {
  return function (req, res, next) {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    res.status(401);
    res.json({error: 'Unauthorized'});
  };
}
