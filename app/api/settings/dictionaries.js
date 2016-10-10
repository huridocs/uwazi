import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';

export default {
  get() {
    return request.get(`${dbURL}/_design/dictionaries/_view/all`)
    .then((response) => {
      return sanitizeResponse(response.json).rows;
    });
  }
};
