import request from '../../shared/JSONRequest'
import {APIURL} from '../config.js'

export default function(cookie) {

  return {
    get: (url, data) => {
      return request.get(APIURL+url, data, cookie);
    },
    post: (url, data) => {
      return request.post(APIURL+url, data);
    },
    delete: (url, data) => {
      return request.delete(APIURL+url, data);
    }
  }

}
