import languagesUtil from 'shared/languages';
import languages from 'shared/languagesList';
import entities from 'api/entities';
import relationships from 'api/relationships/relationships';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';

import elastic from './elastic';

export class IndexError extends Error {}

const handleErrors = async itemsWithErrors => {
  if (itemsWithErrors.length === 0) return;
  const error = new IndexError('ERROR! Failed to index documents.');
  error.errors = itemsWithErrors;
  throw error;
};

function setFullTextSettings(defaultDocument, id, body, doc) {
  const fullText = Object.values(defaultDocument.fullText).join('\f');

  let language;
  if (!defaultDocument.language) {
    language = languagesUtil.detect(fullText);
  }
  if (defaultDocument.language) {
    language = languages(defaultDocument.language);
  }
  const fullTextObject = {
    [`fullText_${language}`]: fullText,
    fullText: { name: 'fullText', parent: id },
  };
  body.push(fullTextObject);
  delete doc.fullText;
}

const bulkIndex = async (docs, _action = 'index', elasticIndex) => {
  const body = [];
  // eslint-disable-next-line max-statements
  docs.forEach(doc => {
    let docBody = Object.assign({ documents: [] }, doc);
    docBody.fullText = 'entity';
    const id = doc._id.toString();
    ['_id', '_rev', 'pdfInfo'].forEach(e => delete docBody[e]);
    const action = {};
    action[_action] = { _index: elasticIndex, _id: id };
    if (_action === 'update') {
      docBody = { doc: docBody };
    }

    const defaultDocument = { ...(entityDefaultDocument(doc.documents, doc.language, 'en') || {}) };

    docBody.documents.forEach(document => {
      delete document.fullText;
    });

    body.push(action);
    body.push(docBody);

    if (defaultDocument.fullText) {
      body.push({
        [_action]: { _index: elasticIndex, _id: `${id}_fullText`, routing: id },
      });
      setFullTextSettings(defaultDocument, id, body, doc);
    }
  });

  const results = await elastic.bulk({ body, requestTimeout: 40000 });
  if (results.items) {
    await handleErrors(results.items.filter(f => f.index.error));
  }

  return results;
};

const newIndexErrorsOrThrow = err => {
  if (!(err instanceof IndexError)) {
    throw err;
  } else {
    return err.errors;
  }
};

const appendRelationships = async entity => {
  const relations = await relationships.get({ entity: entity.sharedId });
  return { ...entity, relationships: relations || [] };
};

const getEntitiesToIndex = async (query, offset, limit, select) => {
  const entitiesToIndex = await entities.get(query, '', {
    skip: offset,
    limit,
    documentsFullText: select && select.includes('+fullText'),
  });

  return Promise.all(entitiesToIndex.map(appendRelationships));
};

const bulkIndexAndCallback = async assets => {
  const { searchInstance, entitiesToIndex, elasticIndex, batchCallback, totalRows } = assets;
  await searchInstance.bulkIndex(entitiesToIndex, 'index', elasticIndex);
  return batchCallback(entitiesToIndex.length, totalRows);
};

const indexBatch = async (offset, totalRows, options, errors = []) => {
  const { query, select, limit, batchCallback, elasticIndex, searchInstance } = options;
  if (offset >= totalRows) {
    return errors.length ? handleErrors(errors) : Promise.resolve();
  }

  const entitiesToIndex = await getEntitiesToIndex(query, offset, limit, select);

  let newIndexErrors = [];

  try {
    await bulkIndexAndCallback({
      searchInstance,
      entitiesToIndex,
      elasticIndex,
      batchCallback,
      totalRows,
    });
  } catch (err) {
    newIndexErrors = newIndexErrorsOrThrow(err);
  }

  return indexBatch(offset + limit, totalRows, options, errors.concat(newIndexErrors));
};

const indexEntities = async ({
  query,
  select = '',
  limit = 50,
  batchCallback = () => {},
  elasticIndex,
  searchInstance,
}) => {
  const totalRows = await entities.count(query);
  return indexBatch(0, totalRows, {
    query,
    select,
    limit,
    batchCallback,
    elasticIndex,
    searchInstance,
  });
};

export { bulkIndex, indexEntities };
