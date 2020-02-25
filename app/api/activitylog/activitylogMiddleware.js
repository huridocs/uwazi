import activitylog from './activitylog';

const ignorelist = [
  'POST/api/users',
  'POST/api/login',
  'POST/api/contact',
  'POST/api/unlockaccount',
  'POST/api/resetpassword',
  'POST/api/recoverpassword',
];

export default (req, _res, next) => {
  const { url, method, params, query, body, user = {} } = req;
  const baseurl = url.split('?').shift();

  if (method !== 'GET' && !ignorelist.includes(method + baseurl) && baseurl.includes('/api/')) {
    const time = Date.now();
    const entry = {
      url: baseurl,
      method,
      params: JSON.stringify(params),
      query: JSON.stringify(query),
      body: JSON.stringify(body),
      user: user._id,
      username: user.username,
      time,
    };
    activitylog.save(entry);
  }
  next();
};
