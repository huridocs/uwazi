/** @format */

import languagesUtil from 'shared/languages';
import languages from 'shared/languagesList';
import errorLog from 'api/log/errorLog';
import entities from 'api/entities';
import relationships from 'api/relationships/relationships';

import elastic from './elastic';

const bulkIndex = (docs, _action = 'index', elasticIndex) => {
  const type = 'entity';
  const body = [];
  docs.forEach(doc => {
    let _doc = doc;
    const id = doc._id.toString();
    delete doc._id;
    delete doc._rev;
    delete doc.pdfInfo;

    let action = {};
    action[_action] = { _index: elasticIndex, _type: type, _id: id };
    if (_action === 'update') {
      _doc = { doc: _doc };
    }

    body.push(action);
    body.push(_doc);

    if (doc.fullText) {
      const fullText = Object.values(doc.fullText).join('\f');

      action = {};
      action[_action] = {
        _index: elasticIndex,
        _type: 'fullText',
        parent: id,
        _id: `${id}_fullText`,
      };
      body.push(action);

      const fullTextQuery = {};
      let language;
      if (!doc.file || (doc.file && !doc.file.language)) {
        language = languagesUtil.detect(fullText);
      }
      if (doc.file && doc.file.language) {
        language = languages(doc.file.language);
      }
      fullTextQuery[`fullText_${language}`] = fullText;
      body.push(fullTextQuery);
      delete doc.fullText;
    }
  });

  return elastic.bulk({ body }).then(res => {
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
  limit = 200,
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
