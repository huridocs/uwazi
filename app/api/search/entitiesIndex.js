/** @format */

import languagesUtil from 'shared/languages';
import languages from 'shared/languagesList';
import errorLog from 'api/log/errorLog';
import entities from 'api/entities';
import relationships from 'api/relationships/relationships';

import elastic from './elastic';

const bulkIndex = (docs, _action = 'index', elasticIndex) => {
  const body = [];
  docs.forEach(doc => {
    let docBody = Object.assign({}, doc);
    docBody.fullText = 'entity';
    const id = doc._id.toString();
    delete docBody._id;
    delete docBody._rev;
    delete docBody.pdfInfo;
    let action = {};
    action[_action] = { _index: elasticIndex, _id: id };
    if (_action === 'update') {
      docBody = { doc: docBody };
    }

    body.push(action);
    body.push(docBody);

    if (doc.fullText) {
      const fullText = Object.values(doc.fullText).join('\f');

      action = {};
      action[_action] = {
        _index: elasticIndex,
        _id: `${id}_fullText`,
        routing: id,
      };
      body.push(action);

      let language;
      if (!doc.file || (doc.file && !doc.file.language)) {
        language = languagesUtil.detect(fullText);
      }
      if (doc.file && doc.file.language) {
        language = languages(doc.file.language);
      }
      const fullTextObject = {
        [`fullText_${language}`]: fullText,
        fullText: { name: 'fullText', parent: id },
      };
      body.push(fullTextObject);
      delete doc.fullText;
    }
  });

  return elastic.bulk({ body, requestTimeout: 40000 }).then(res => {
    if (res.items) {
      res.items.forEach(f => {
        if (f.index.error) {
          errorLog.error(
            `ERROR Failed to index document ${f.index._id}: ${JSON.stringify(
              f.index.error,
              null,
              ' '
            )}`
          );
        }
      });
    }
    return res;
  });
};

const indexEntities = (
  query,
  select,
  limit = 50,
  { batchCallback = () => {}, elasticIndex, searchInstance }
) => {
  const index = (offset, totalRows) => {
    if (offset >= totalRows) {
      return Promise.resolve();
    }

    return entities
      .get(query, select, { skip: offset, limit })
      .then(entitiesToIndex =>
        Promise.all(
          entitiesToIndex.map(entity =>
            relationships
              .get({ entity: entity.sharedId })
              .then(relations => ({ ...entity, relationships: relations || [] }))
          )
        )
      )
      .then(entitiesToIndex =>
        searchInstance
          .bulkIndex(entitiesToIndex, 'index', elasticIndex)
          .then(() => batchCallback(entitiesToIndex.length, totalRows))
      )
      .then(() => index(offset + limit, totalRows));
  };
  return entities.count(query).then(totalRows => index(0, totalRows));
};

export { bulkIndex, indexEntities };
