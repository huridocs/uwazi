const APIURL = process.env.API_URL;
export default {APIURL: APIURL ? APIURL : document.location['origin'] + '/api/'};
