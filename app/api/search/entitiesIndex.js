import PromisePoolModule from '@supercharge/promise-pool';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { detectLanguage } from '#shared/detectLanguage.js';
import entities from '#api/entities/index.js';
import { legacyLogger } from '#api/log/index.js';
import { entityDefaultDocument } from '#shared/entityDefaultDocument.js';
import { ElasticEntityMapper } from '#api/entities.v2/database/ElasticEntityMapper.js';
import { LanguageUtils } from '#shared/language/index.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { otherLanguageSchema } from '#shared/language/availableLanguages.js';
import { getTenantESMapping } from '#api/tenants/tenantESMapping.js';
import elasticMapFactory from '../../../database/elastic_mapping/elasticMapFactory.js';
import { elastic } from './elastic.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { PostgresEntitiesDAOFactory } from '#api/core/infrastructure/factories/PostgresEntitiesDAOFactory.js';

const PromisePool = PromisePoolModule.default ?? PromisePoolModule;

class IndexError extends Error {}

class UnsupportedQueryError extends Error {}

const FLAT_FILTER_KEYS = ['language', 'template', 'sharedId', '_id'];
const METADATA_VALUE_PATH = /^metadata\.([^.]+)\.value$/;

const flatFiltersFrom = query => {
  const filters = {};
  if (query.language) filters.language = query.language;
  if (query.template) filters.template = query.template;
  if (query.sharedId?.$in) filters.sharedIds = query.sharedId.$in;
  else if (query.sharedId) filters.sharedId = query.sharedId;
  if (query._id?.$in) filters.ids = query._id.$in;
  else if (query._id) filters._id = query._id;
  return filters;
};

const metadataValueInFromOr = orClauses =>
  orClauses.map(clause => {
    const keys = Object.keys(clause);
    const match = keys.length === 1 && keys[0].match(METADATA_VALUE_PATH);
    if (!match) {
      throw new UnsupportedQueryError(
        `Unsupported $or clause in indexEntities query: ${JSON.stringify(clause)}`
      );
    }
    return { property: match[1], value: clause[keys[0]] };
  });

const flatFiltersFromAndClause = clause => {
  const unsupportedKeys = Object.keys(clause).filter(k => !FLAT_FILTER_KEYS.includes(k));
  if (unsupportedKeys.length > 0) {
    throw new UnsupportedQueryError(
      `Unsupported $and clause in indexEntities query: ${JSON.stringify(clause)}`
    );
  }
  return flatFiltersFrom(clause);
};

// Translates the Mongo query shapes real callers of search.indexEntities use into Postgres
// filters. Postgres cannot execute Mongo queries as a fallback (see
// plans/fix-postgres-entities-search-parity.md - no tenant data sync between backends
// exists yet), so any shape outside what's explicitly handled here throws instead of
// silently matching every entity in the tenant.
const entityFiltersFromQuery = query => {
  if (query.$and) {
    return query.$and.reduce(
      (filters, clause) =>
        clause.$or
          ? { ...filters, metadataValueIn: metadataValueInFromOr(clause.$or) }
          : { ...filters, ...flatFiltersFromAndClause(clause) },
      {}
    );
  }

  const unsupportedKeys = Object.keys(query).filter(k => !FLAT_FILTER_KEYS.includes(k));
  if (unsupportedKeys.length > 0) {
    throw new UnsupportedQueryError(
      `Unsupported indexEntities query shape: ${JSON.stringify(query)}`
    );
  }
  return flatFiltersFrom(query);
};

const preprocessEntitiesToIndex = async entitiesToIndex => {
  const transactionManager = TransactionManagerFactory.default();
  const settingsDataSource = SettingsDataSourceFactory.default({ transactionManager });

  if (!(await settingsDataSource.readNewRelationshipsAllowed())) {
    return entitiesToIndex;
  }

  const templateDS = TemplatesDataSourceFactory.default({ transactionManager });
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

function setFullTextSettings(defaultDocument, id, body, doc) {
  const fullText = Object.values(defaultDocument.fullText).join('\f');

  let language;
  if (!defaultDocument.language) {
    language = detectLanguage(fullText);
  }
  if (defaultDocument.language) {
    language =
      LanguageUtils.fromISO639_3(defaultDocument.language)?.elastic || otherLanguageSchema.elastic;
  }

  const fullTextObject = {
    [`fullText_${language}`]: fullText,
    filename: defaultDocument.filename,
    fullText: { name: 'fullText', parent: id },
  };
  body.push(fullTextObject);
  delete doc.fullText;
}

const bulkIndex = async (docs, _action = 'index') => {
  const body = [];

  docs.forEach(doc => {
    let docBody = { documents: [], ...doc };
    docBody.fullText = 'entity';
    const id = doc._id.toString();
    ['_id', '_rev'].forEach(e => delete docBody[e]);
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

const getEntitiesToIndex = async (query, stepBach, limit, select) => {
  const documentsFullText = Boolean(select && select.includes('+fullText'));

  if (PostgresEntitiesDAOFactory.isEnabled()) {
    return PostgresEntitiesDAOFactory.default().getByIdsWithDocuments(stepBach, {
      limit,
      documentsFullText,
    });
  }

  const thisQuery = { ...query };
  thisQuery._id = { $in: stepBach };
  return entities.getUnrestrictedWithDocuments(thisQuery, '+permissions', {
    limit,
    documentsFullText,
  });
};

const bulkIndexAndCallback = async assets => {
  const { searchInstance, entitiesToIndex, batchCallback, totalRows } = assets;
  await searchInstance.bulkIndex(entitiesToIndex, 'index');
  return batchCallback(entitiesToIndex.length, totalRows);
};

const getSteps = async (query, limit) => {
  const allIds = PostgresEntitiesDAOFactory.isEnabled()
    ? await PostgresEntitiesDAOFactory.default().getIds(entityFiltersFromQuery(query))
    : await entities.getWithoutDocuments(query, '_id');
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
  const totalRows = PostgresEntitiesDAOFactory.isEnabled()
    ? await PostgresEntitiesDAOFactory.default().count(entityFiltersFromQuery(query))
    : await entities.count(query);
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

const resetIndex = async () => {
  await elastic.indices.delete();
  await elastic.indices.create({ body: getTenantESMapping() });
};

const reindexAll = async (tmpls, searchInstance) => {
  await resetIndex();
  await updateMapping(tmpls);
  return indexEntities({ query: {}, select: '+fullText', searchInstance });
};

export {
  IndexError,
  UnsupportedQueryError,
  bulkIndex,
  indexEntities,
  updateMapping,
  reindexAll,
  resetIndex,
};
