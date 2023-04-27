/* eslint-disable @typescript-eslint/no-floating-promises */
import { APIURL } from 'app/config';
import superagent from 'superagent';

interface Fields {
  [key: string]: string;
}

export async function httpRequest(
  endpoint: string,
  fields: Fields,
  headers: Fields,
  file: File | undefined
) {
  return new Promise((resolve, reject) => {
    const req = superagent.post(`${APIURL}${endpoint}`);

    Object.keys(headers).forEach((headerKey: string) => {
      req.set(headerKey, headers[headerKey]);
    });

    Object.keys(fields).forEach((fieldKey: string) => {
      req.field(fieldKey, fields[fieldKey]);
    });

    if (file) {
      req.attach('file', file, file.name);
    }

    req
      .on('response', response => {
        if (response.status === 200) {
          const data = JSON.parse(response.text);
          resolve(data);
        } else {
          reject(response.error);
        }
      })
      .end();
  });
}
