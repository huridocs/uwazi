import { language as languages } from 'shared/languagesList';
import entities from 'api/entities';
import { legacyLogger } from 'api/log';
import PromisePool from '@supercharge/promise-pool';
import { ElasticEntityMapper } from 'api/entities.v2/database/ElasticEntityMapper';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import elasticMapping from '../../../database/elastic_mapping/elastic_mapping';
import elasticMapFactory from '../../../database/elastic_mapping/elasticMapFactory';
import { elastic } from './elastic';

export class IndexError extends Error {}

const preprocessEntitiesToIndex = async entitiesToIndex => {
  const db = getConnection();
  const transactionManager = DefaultTransactionManager();
  const settingsDataSource = new MongoSettingsDataSource(db, transactionManager);

  if (!(await settingsDataSource.readNewRelationshipsAllowed())) {
    return entitiesToIndex;
  }

  const templateDS = new MongoTemplatesDataSource(getConnection(), DefaultTransactionManager());
  const transformer = new ElasticEntityMapper(templateDS);
  return Promise.all(entitiesToIndex.map(e => transformer.toElastic(e)));
};

const handleErrors = (itemsWithErrors, { logError = false } = {}) => {
  if (itemsWithErrors.length === 0) return;
  if (logError) {
    legacyLogger.error(
      `ERROR! Failed to index documents.\r\n${JSON.stringify(itemsWithErrors, null, ' ')}\r\n`
    );
  }

  const error = new IndexError('ERROR! Failed to index documents.');
  error.errors = itemsWithErrors;
  throw error;
};

const createFullTextObject = (document, entityId) => {
  const text = Object.values(document.fullText).join('\f');
  const language = languages(document.language);
  return {
    id: `${document._id}_${entityId}`,
    [`fullText_${language}`]: text,
    filename: document.filename,
    originalname: document.originalname,
    language,
    fullText: { name: 'fullText', parent: entityId },
  };
};

const createFullTextIndexRequest = (method, body) => {
  const header = {
    [method]: {
      _id: `${body.id}_fullText`,
      routing: body.fullText.parent,
    },
  };

  return [header, body];
};

const bulkIndex = async (_entities, _action = 'index') => {
  const body = [];
  // eslint-disable-next-line max-statements
  _entities.forEach(_entity => {
    let entity = { documents: [], ..._entity };
    entity.fullText = 'entity';
    const entityId = _entity._id.toString();
    ['_id', '_rev'].forEach(e => delete entity[e]);
    const action = {};
    action[_action] = { _id: entityId };
    if (_action === 'update') {
      entity = { doc: entity };
    }

    const documentsRequests = [];

    entity.documents.forEach(document => {
      if (!document.fullText) return;

      body.push(...createFullTextIndexRequest(_action, createFullTextObject(document, entityId)));

      delete document.fullText;
    });

    body.push(action);
    body.push(entity);
    body.push(...documentsRequests);
  });

  const results = await elastic.bulk({ body });
  if (results.body.items) {
    handleErrors(results.body.items.filter(f => f.index.error));
  }

  return results;
};

const getEntitiesToIndex = async (query, stepBach, limit, select) => {
  const thisQuery = { ...query };
  thisQuery._id = { $in: stepBach };
  return entities.getUnrestrictedWithDocuments(thisQuery, '+permissions', {
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
  const allIds = await entities.getWithoutDocuments(query, '_id');
  return [...Array(Math.ceil(allIds.length / limit))].map((_v, i) =>
    allIds.slice(i * limit, (i + 1) * limit)
  );
};

/*eslint max-statements: ["error", 20]*/
const indexBatch = async (totalRows, options) => {
  const { query, select, limit, batchCallback, searchInstance } = options;
  const steps = await getSteps(query, limit);

  const { _id: remove, ...queryToIndex } = query;

  const promisePool = new PromisePool();
  const { errors: indexingErrors } = await promisePool
    .for(steps)
    .withConcurrency(10)
    .process(async stepBatch => {
      const entitiesToPreprocess = await getEntitiesToIndex(queryToIndex, stepBatch, limit, select);
      const entitiesToIndex = await preprocessEntitiesToIndex(entitiesToPreprocess);
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
  const mapping = await elasticMapFactory.mapping(tmpls);
  await elastic.indices.putMapping({ body: mapping });
};

const reindexAll = async (tmpls, searchInstance) => {
  await elastic.indices.delete();
  await elastic.indices.create({ body: elasticMapping });
  await updateMapping(tmpls);
  return indexEntities({ query: {}, searchInstance });
};

export { bulkIndex, indexEntities, updateMapping, reindexAll };
