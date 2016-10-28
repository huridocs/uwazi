import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import P from 'bluebird';

Promise.all([request.get(dbURL + '/_design/templates/_view/all'), request.get(dbURL + '/_design/documents/_view/all')])
.then(([templatesResponse, docsResponse]) => {
  let total = docsResponse.json.total_rows;
  P.resolve(docsResponse.json.rows).map((_doc) => {
    let doc = _doc.value;
    let docTemplateId = doc.template;
    let template = templatesResponse.json.rows.find((tpl) => tpl.id === docTemplateId).value;
    template.properties.forEach((property) => {
      if (property.type === 'multidate' && doc.metadata[property.name]) {
        doc.metadata[property.name] = doc.metadata[property.name].map((value) => parseInt(value, 10));
      }

      if (property.type === 'multidaterange' && doc.metadata[property.name]) {
        doc.metadata[property.name] = doc.metadata[property.name].map((value) => {
          if (value.from) {
            value.from = parseInt(value.from, 10);
          }

          if (value.to) {
            value.to = parseInt(value.to, 10);
          }

          return value;
        });
      }

      if (property.type === 'date') {
        doc.metadata[property.name] = parseInt(doc.metadata[property.name], 10);
        if (isNaN(doc.metadata[property.name])) {
          delete doc.metadata[property.name];
        }
      }
    });

    total -= 1;
    console.log('. ' + total + ' left');
    if (total === 0) {
      console.log('Done, remember to reset elastic index!');
    }
    return request.post(dbURL + '/_design/entities/_update/partialUpdate/' + doc._id, doc)
    .catch(console.log);
  }, {concurrency: 5});
})
.catch((error) => {
  console.log(error);
});
