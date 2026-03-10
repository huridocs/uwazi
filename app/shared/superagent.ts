/* eslint-disable @typescript-eslint/no-floating-promises */
import { APIURL } from 'app/config';
import superagent, { MultipartValueSingle } from 'superagent';

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
      req.attach('file', file as unknown as MultipartValueSingle, file.name);
    }

    req
      .on('response', response => {
        const data = JSON.parse(response.text);
        if (response.status === 200) {
          resolve(data);
        } else {
          reject(data);
        }
      })
      .end();
  });
}
