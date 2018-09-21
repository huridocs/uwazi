export default function (roles = ['admin']) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role) && req.get('X-Requested-With') === 'XMLHttpRequest') {
      return next();
    }
    res.status(401);
    return res.json({ error: 'Unauthorized' });
  };
}
