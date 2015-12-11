import request from '../../shared/JSONRequest'
import config from '../config.js'

export default {
  get: (url, data) => {
    return request.get(config.APIURL+url, data);
  },
  post: (url, data) => {
    return request.post(config.APIURL+url, data);
  },
  delete: (url, data) => {
    return request.delete(config.APIURL+url, data);
  }
}
