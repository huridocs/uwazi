import request from '../../shared/JSONRequest'
import {APIURL} from '../config.js'

export default {
  get: (url, data) => {
    return request.get(APIURL+url, data);
  },
  post: (url, data) => {
    return request.post(APIURL+url, data);
  },
  delete: (url, data) => {
    return request.delete(APIURL+url, data);
  }
}
