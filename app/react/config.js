const APIURL = process.env.API_URL || '/api/';
const { SENTRY_APP_DSN } = process.env;

export default { APIURL };
export { APIURL, SENTRY_APP_DSN };
