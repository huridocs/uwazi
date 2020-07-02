import languagesUtil from 'shared/languages';
import languages from 'shared/languagesList';
import entities from 'api/entities';
import relationships from 'api/relationships/relationships';
import errorLog from 'api/log/errorLog';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';
import PromisePool from '@supercharge/promise-pool';
import elastic from './elastic';

export class IndexError extends Error {}

const handleErrors = (itemsWithErrors, { logError = false } = {}) => {
  if (itemsWithErrors.length === 0) return;

  if (logError) {
    errorLog.error(
      `ERROR! Failed to index documents.\r\n${JSON.stringify(itemsWithErrors, null, ' ')}\r\n`
    );
  }

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
    handleErrors(results.items.filter(f => f.index.error));
  }

  return results;
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

  for (let i = 0; i < entitiesToIndex.length; i += 1) {
    for (let j = 0; j < entitiesToIndex[i].documents.length; j += 1) {
      delete entitiesToIndex[i].documents[j].pdfInfo;
    }
  }

  return Promise.all(entitiesToIndex.map(appendRelationships));
  // return entitiesToIndex;
};

const bulkIndexAndCallback = async assets => {
  const { searchInstance, entitiesToIndex, elasticIndex, batchCallback, totalRows } = assets;
  await searchInstance.bulkIndex(entitiesToIndex, 'index', elasticIndex);
  return batchCallback(entitiesToIndex.length, totalRows);
};

const indexBatch = async (offset, totalRows, options, errors = []) => {
  const { query, select, limit, batchCallback, elasticIndex, searchInstance } = options;

  const chunks = [];
  for (let cursor = 0; cursor < totalRows; cursor += limit) {
    chunks.push(chunks.length + 1);
  }

  const promisePool = new PromisePool();
  const { errors: indexingErrors } = await promisePool
    .for(chunks)
    .withConcurrency(20)
    .process(async chunkIndex => {
      const thisOffset = (chunkIndex - 1) * limit;
      // throw new Error("blah")
      const entitiesToIndex = await getEntitiesToIndex(query, thisOffset, limit, select);
      await bulkIndexAndCallback({
        searchInstance,
        entitiesToIndex,
        elasticIndex,
        batchCallback,
        totalRows,
      });
    });

    // console.log("len", indexingErrors[0].errors.length);
    console.log("len errs", indexingErrors.length);
    console.log("errs", indexingErrors);
    if(indexingErrors[0] && indexingErrors[0].errors) {
      console.log("errs in", indexingErrors[0].errors);
      for(let i= 0; i < indexingErrors[0].errors.length; i += 1) {
        console.log(indexingErrors[0].errors[i]);
      }
    }
    //&& indexingErrors[0].errors.length

  return indexingErrors.length > 0
    ? handleErrors(indexingErrors, { logError: true })
    : Promise.resolve();
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
