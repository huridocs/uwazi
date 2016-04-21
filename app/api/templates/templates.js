import {db_url as dbURL} from '../config/database.js';
import request from 'shared/JSONRequest.js';
import generateNames from './generateNames';

export default {
  save(template) {
    template.type = 'template';
    template.properties = template.properties || [];
    template.properties = generateNames(template.properties);

    return request.post(dbURL, template)
    .then((response) => {
      return response.json;
    })
    .catch((error) => error.json);
  }
};
