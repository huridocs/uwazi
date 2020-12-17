import languagesUtil from 'shared/languages';
import languages from 'shared/languagesList';
import entities from 'api/entities';
import errorLog from 'api/log/errorLog';
import { tenants } from 'api/tenants';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';
import PromisePool from '@supercharge/promise-pool';
import { elastic } from './elastic';
import elasticMapFactory from '../../../database/elastic_mapping/elasticMapFactory';
import elasticMapping from '../../../database/elastic_mapping/elastic_mapping';

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

const bulkIndex = async (docs, _action = 'index') => {
  const body = [];
  // eslint-disable-next-line max-statements
  docs.forEach(doc => {
    let docBody = { documents: [], ...doc };
    docBody.fullText = 'entity';
    const id = doc._id.toString();
    ['_id', '_rev', 'pdfInfo'].forEach(e => delete docBody[e]);
    const action = {};
    action[_action] = { _id: id };
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
        [_action]: { _id: `${id}_fullText`, routing: id },
      });
      setFullTextSettings(defaultDocument, id, body, doc);
    }
  });

  const results = await elastic.bulk({ body });
  if (results.body.items) {
    handleErrors(results.body.items.filter(f => f.index.error));
  }

  return results;
};

const getEntitiesToIndex = async (query, stepIndex, limit, select) => {
  const thisQuery = { ...query };
  thisQuery._id = !thisQuery._id ? { $gte: stepIndex } : thisQuery._id;
  return entities.get(thisQuery, '', {
    limit,
    documentsFullText: select && select.includes('+fullText'),
  });
};

const bulkIndexAndCallback = async assets => {
  const { searchInstance, entitiesToIndex, batchCallback, totalRows } = assets;
  await searchInstance.bulkIndex(entitiesToIndex, 'index');
  return batchCallback(entitiesToIndex.length, totalRows);
};

const getSteps = async (query, limit) => {
  const allIds = await entities.getWithoutDocuments(query, '_id', { sort: { _id: 1 } });
  const milestoneIds = [];
  for (let i = 0; i < allIds.length; i += limit) {
    milestoneIds.push(allIds[i]);
  }
  return milestoneIds;
};

/*eslint max-statements: ["error", 20]*/
const indexBatch = async (totalRows, options) => {
  const { query, select, limit, batchCallback, searchInstance } = options;
  const steps = await getSteps(query, limit);

  const promisePool = new PromisePool();
  const { errors: indexingErrors } = await promisePool
    .for(steps)
    .withConcurrency(10)
    .process(async stepIndex => {
      const entitiesToIndex = await getEntitiesToIndex(query, stepIndex, limit, select);
      if (entitiesToIndex.length > 0) {
        await bulkIndexAndCallback({
          searchInstance,
          entitiesToIndex,
          batchCallback,
          totalRows,
        });
      }
    });

  let returnErrors = indexingErrors;
  if (indexingErrors.length > 0 && indexingErrors[0].errors) {
    returnErrors = indexingErrors[0].errors;
  }

  return returnErrors.length > 0
    ? handleErrors(returnErrors, { logError: true })
    : Promise.resolve();
};

const indexEntities = async ({
  query,
  select = '',
  limit = 50,
  batchCallback = () => {},
  searchInstance,
}) => {
  const totalRows = await entities.count(query);
  return indexBatch(totalRows, {
    query,
    select,
    limit,
    batchCallback,
    searchInstance,
  });
};

const updateMapping = async tmpls => {
  const mapping = elasticMapFactory.mapping(tmpls);
  await elastic.indices.putMapping({ body: mapping });
};

const reindexAll = async (tmpls, searchInstance) => {
  await elastic.indices.delete();
  await elastic.indices.create({ body: elasticMapping });
  await updateMapping(tmpls);
  return indexEntities({ query: {}, searchInstance });
};

const equalPropMapping = (mapA, mapB) => {
  if (!mapA || !mapB) {
    return true;
  }

  const sameAmountOfProps =
    Object.keys(mapA.properties).length === Object.keys(mapB.properties).length;
  const sameProps =
    Object.keys(mapA.properties).length === Object.keys(mapB.properties).length &&
    Object.keys(mapA.properties).reduce(
      (result, propKey) =>
        result &&
        mapB.properties[propKey] &&
        mapA.properties[propKey].type === mapB.properties[propKey].type,
      true
    );
  return sameAmountOfProps && sameProps;
};

const checkMapping = async template => {
  const errors = [];
  const mapping = elasticMapFactory.mapping([template]);
  const currentMapping = await elastic.indices.getMapping();
  const elasticIndex = tenants.current().indexName;
  const mappedProps =
    currentMapping.body[elasticIndex].mappings.properties.metadata.properties || {};
  const newMappedProps = mapping.properties.metadata.properties;
  Object.keys(newMappedProps).forEach(key => {
    if (!equalPropMapping(mappedProps[key], newMappedProps[key])) {
      errors.push({ name: template.properties.find(p => p.name === key).label });
    }
  });

  return { errors, valid: !errors.length };
};

export { bulkIndex, indexEntities, updateMapping, checkMapping, reindexAll };
