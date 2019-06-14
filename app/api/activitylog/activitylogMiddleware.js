import activitylog from './activitylog';

const ignorelist = [
  '/captcha',
  '/404',
  '/api/activitylog',
  '/favicon.ico'
];

export default (req, res, next) => {
  const { url, method, params, query, body, user = {} } = req;
  const baseurl = url.split('?').shift();
  if (!ignorelist.includes(baseurl) && baseurl.includes('api')) {
    const time = Date.now();
    const entry = {
      url: baseurl,
      method,
      params: JSON.stringify(params),
      query: JSON.stringify(query),
      body: JSON.stringify(body),
      user: user._id,
      username: user.username,
      time
    };
    activitylog.save(entry);
  }
  next();
};
