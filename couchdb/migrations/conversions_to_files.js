import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import documents from 'api/documents/documents';

let extractConversion = (conversion) => {
  return request.get(`${dbURL}/_design/documents/_view/conversions?key="${conversion}"`)
  .then(({json}) => {
    let html = json.rows[0].value;
    console.log(Object.keys(html));
    return Promise.all([
      html,
      documents.saveHTML(html)
    ])
  })
  .then(([html]) => {
    return request.delete(`${dbURL}/${html._id}`, {rev: html._rev});
  })
  .then((response) => {
    console.log(response);
  });
}

let processConverions = (conversions) => {
  return conversions.reduce((p, conversion) => {
    return p.then(() => extractConversion(conversion));
  }, Promise.resolve()); // initial
};

request.get(`${dbURL}/_design/documents/_view/all`)
.then((result) => {
  let conversions = result.json.rows;
  return processConverions(conversions.map(c => c.id));
})
.catch((err) => {
  console.log(err);
});
