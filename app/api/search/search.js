/* eslint-disable max-lines */
import date from 'api/utils/date';
import propertiesHelper from 'shared/comonProperties';
import dictionariesModel from 'api/thesauri/dictionariesModel';
import { createError } from 'api/utils';
import { filterOptions } from 'shared/optionsUtils';
import { preloadOptionsLimit, preloadOptionsSearch } from 'shared/config';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { checkWritePermissions } from 'shared/permissionsUtils';
import documentQueryBuilder from './documentQueryBuilder';
import { elastic } from './elastic';
import entities from '../entities';
import entitiesModel from '../entities/entitiesModel';
import templatesModel from '../templates';
import { bulkIndex, indexEntities, updateMapping } from './entitiesIndex';
import thesauri from '../thesauri';

function processFilters(filters, properties) {
  return Object.keys(filters || {}).reduce((res, filterName) => {
    const suggested = filterName.startsWith('__');
    const propertyName = suggested ? filterName.substring(2) : filterName;
    const property = properties.find(p => p.name === propertyName);
    if (!property) {
      return res;
    }

    let { type } = property;
    const value = filters[filterName];
    if (['date', 'multidate', 'numeric'].includes(property.type)) {
      type = 'range';
    }
    if (['select', 'multiselect', 'relationship'].includes(property.type)) {
      type = 'multiselect';
    }
    if (property.type === 'multidaterange' || property.type === 'daterange') {
      type = 'daterange';
    }

    if (['multidaterange', 'daterange', 'date', 'multidate'].includes(property.type)) {
      value.from = date.descriptionToTimestamp(value.from);
      value.to = date.descriptionToTimestamp(value.to);
    }

    if (property.type === 'relationshipfilter') {
      return [
        ...res,
        {
          ...property,
          value,
          suggested,
          type,
          filters: property.filters.map(f => ({
            ...f,
            name: `${f.name}.value`,
          })),
        },
      ];
    }

    return [
      ...res,
      {
        ...property,
        value,
        suggested,
        type,
        name: `${property.name}.value`,
      },
    ];
  }, []);
}

function aggregationProperties(properties) {
  return properties
    .filter(
      property =>
        property.type === 'select' ||
        property.type === 'multiselect' ||
        property.type === 'relationship' ||
        property.type === 'nested'
    )
    .map(property => ({ ...property, name: `${property.name}.value` }));
}

function metadataSnippetsFromSearchHit(hit) {
  const defaultSnippets = { count: 0, snippets: [] };
  if (hit.highlight) {
    const metadataHighlights = hit.highlight;
    const metadataSnippets = Object.keys(metadataHighlights).reduce((foundSnippets, field) => {
      const fieldSnippets = { field, texts: metadataHighlights[field] };
      return {
        count: foundSnippets.count + fieldSnippets.texts.length,
        snippets: [...foundSnippets.snippets, fieldSnippets],
      };
    }, defaultSnippets);
    return metadataSnippets;
  }
  return defaultSnippets;
}

function getSnippets() {
  return snippet => {
    const regex = /\[\[(\d+)\]\]/g;
    const matches = regex.exec(snippet);
    return {
      text: snippet.replace(regex, ''),
      page: matches ? Number(matches[1]) : 0,
    };
  };
}

function getHits(hit) {
  return hit.inner_hits &&
    hit.inner_hits.fullText.hits.hits &&
    hit.inner_hits.fullText.hits.hits.length > 0 &&
    hit.inner_hits.fullText.hits.hits[0].highlight
    ? hit.inner_hits.fullText.hits.hits
    : undefined;
}
function fullTextSnippetsFromSearchHit(hit) {
  const hits = getHits(hit);
  if (hits) {
    const fullTextHighlights = hits[0].highlight;
    const fullTextLanguageKey = Object.keys(fullTextHighlights)[0];
    return fullTextHighlights[fullTextLanguageKey].map(getSnippets());
  }
  return [];
}

function snippetsFromSearchHit(hit) {
  const snippets = {
    count: 0,
    metadata: [],
    fullText: [],
  };

  const metadataSnippets = metadataSnippetsFromSearchHit(hit);
  const fullTextSnippets = fullTextSnippetsFromSearchHit(hit);
  snippets.count = metadataSnippets.count + fullTextSnippets.length;
  snippets.metadata = metadataSnippets.snippets;
  snippets.fullText = fullTextSnippets;

  return snippets;
}

function searchGeolocation(documentsQuery, templates) {
  documentsQuery.limit(9999);
  documentsQuery.from(0);
  const geolocationProperties = [];

  templates.forEach(template => {
    template.properties.forEach(prop => {
      if (prop.type === 'geolocation') {
        geolocationProperties.push(`${prop.name}`);
      }

      if (prop.type === 'relationship' && prop.inherit) {
        const contentTemplate = templates.find(t => t._id.toString() === prop.content.toString());
        const inheritedProperty = contentTemplate.properties.find(
          p => p._id.toString() === prop.inheritProperty.toString()
        );
        if (inheritedProperty.type === 'geolocation') {
          geolocationProperties.push(`${prop.name}`);
        }
      }
    });
  });

  documentsQuery.hasMetadataProperties(geolocationProperties);

  const selectProps = geolocationProperties
    .map(p => `metadata.${p}`)
    .concat(['title', 'template', 'sharedId', 'language']);

  documentsQuery.select(selectProps);
}

const _sanitizeAgregationNames = aggregations =>
  Object.keys(aggregations).reduce((allAggregations, key) => {
    const sanitizedKey = key.replace('.value', '');
    return Object.assign(allAggregations, { [sanitizedKey]: aggregations[key] });
  }, {});

const indexedDictionaryValues = dictionary =>
  dictionary.values
    .reduce((values, v) => {
      if (v.values) {
        return values.concat(v.values, [v]);
      }
      values.push(v);
      return values;
    }, [])
    .reduce((v, value) => {
      // eslint-disable-next-line no-param-reassign
      v[value.id] = value;
      return v;
    }, {});

const _getAggregationDictionary = async (aggregation, language, property, dictionaries) => {
  if (property.type === 'relationship') {
    const entitiesSharedId = aggregation.buckets.map(bucket => bucket.key);

    const bucketEntities = await entitiesModel.get(
      {
        sharedId: { $in: entitiesSharedId },
        language,
      },
      {
        sharedId: 1,
        title: 1,
        icon: 1,
      }
    );

    const dictionary = thesauri.entitiesToThesauri(bucketEntities);
    return [dictionary, indexedDictionaryValues(dictionary)];
  }

  const dictionary = dictionaries.find(d => d._id.toString() === property.content.toString());
  return [dictionary, indexedDictionaryValues(dictionary)];
};

const _formatDictionaryWithGroupsAggregation = (aggregation, dictionary) => {
  const buckets = dictionary.values
    .map(dictionaryValue => {
      const bucket = aggregation.buckets.find(b => b.key === dictionaryValue.id);
      if (bucket && dictionaryValue.values) {
        bucket.values = dictionaryValue.values
          .map(v => aggregation.buckets.find(b => b.key === v.id))
          .filter(b => b);
      }
      return bucket;
    })
    .filter(b => b);
  const bucketsIncludeMissing = aggregation.buckets.find(b => b.key === 'missing');
  if (bucketsIncludeMissing) {
    buckets.push(bucketsIncludeMissing);
  }
  return Object.assign(aggregation, { buckets });
};

const _denormalizeAggregations = async (aggregations, templates, dictionaries, language) => {
  const properties = propertiesHelper.allUniqueProperties(templates);
  return Object.keys(aggregations).reduce(async (denormaLizedAgregationsPromise, key) => {
    const denormaLizedAgregations = await denormaLizedAgregationsPromise;
    if (
      !aggregations[key].buckets ||
      key === '_types' ||
      aggregations[key].type === 'nested' ||
      key === 'generatedToc' ||
      key === 'permissions'
    ) {
      return Object.assign(denormaLizedAgregations, { [key]: aggregations[key] });
    }

    const property = properties.find(prop => prop.name === key || `__${prop.name}` === key);

    const [dictionary, dictionaryValues] = await _getAggregationDictionary(
      aggregations[key],
      language,
      property,
      dictionaries
    );

    const buckets = aggregations[key].buckets
      .map(bucket => {
        const labelItem =
          bucket.key === 'missing' ? { label: 'No label' } : dictionaryValues[bucket.key];

        if (labelItem) {
          const { label, icon } = labelItem;
          return Object.assign(bucket, { label, icon });
        }
        return null;
      })
      .filter(item => item);

    let denormalizedAggregation = Object.assign(aggregations[key], { buckets });
    if (dictionary && dictionary.values.find(v => v.values)) {
      denormalizedAggregation = _formatDictionaryWithGroupsAggregation(
        denormalizedAggregation,
        dictionary
      );
    }
    return Object.assign(denormaLizedAgregations, { [key]: denormalizedAggregation });
  }, {});
};

const _sanitizeAggregationsStructure = (aggregations, limit) => {
  const result = {};
  Object.keys(aggregations).forEach(aggregationKey => {
    const aggregation = aggregations[aggregationKey];

    //grouped dictionary
    if (aggregation.buckets && !Array.isArray(aggregation.buckets)) {
      aggregation.buckets = Object.keys(aggregation.buckets).map(key => ({
        key,
        ...aggregation.buckets[key],
      }));
    }

    //nested
    if (!aggregation.buckets) {
      Object.keys(aggregation).forEach(key => {
        if (aggregation[key].buckets) {
          const buckets = aggregation[key].buckets.map(option => ({
            key: option.key,
            ...option.filtered.total,
          }));
          result[key] = {
            type: 'nested',
            doc_count: aggregation[key].doc_count,
            buckets,
          };
        }
      });
    }

    if (aggregation.buckets) {
      const bucketsWithResults = aggregation.buckets.filter(b => b.filtered.doc_count);
      const missingBucket = bucketsWithResults.find(b => b.key === 'missing');
      aggregation.count = bucketsWithResults.length;
      aggregation.buckets = aggregation.buckets.slice(0, limit);
      const bucketsIncludeMissing = aggregation.buckets.find(b => b.key === 'missing');
      if (!bucketsIncludeMissing && missingBucket) {
        aggregation.buckets = aggregation.buckets.slice(0, limit - 1);
        aggregation.buckets.push(missingBucket);
      }
    }

    result[aggregationKey] = aggregation;
  });
  return result;
};

const _addAnyAggregation = (aggregations, filters, response) => {
  const result = {};
  Object.keys(aggregations).map(aggregationKey => {
    const aggregation = aggregations[aggregationKey];

    if (aggregation.buckets && aggregationKey !== '_types') {
      const missingBucket = aggregation.buckets.find(b => b.key === 'missing');
      const keyFilters = ((filters || {})[aggregationKey.replace('.value', '')] || {}).values || [];
      const filterNoneOrMissing =
        !keyFilters.filter(v => v !== 'any').length || keyFilters.find(v => v === 'missing');

      const anyCount =
        (typeof response.body.hits.total === 'object'
          ? response.body.hits.total.value
          : response.body.hits.total) -
        (missingBucket && filterNoneOrMissing ? missingBucket.filtered.doc_count : 0);

      aggregation.buckets.push({
        key: 'any',
        doc_count: anyCount,
        label: 'Any',
        filtered: { doc_count: anyCount },
      });
      aggregation.count += 1;
    }

    result[aggregationKey] = aggregation;
  });

  return result;
};

const _sanitizeAggregations = async (
  aggregations,
  templates,
  dictionaries,
  language,
  limit = preloadOptionsLimit
) => {
  const sanitizedAggregations = _sanitizeAggregationsStructure(aggregations, limit);
  const sanitizedAggregationNames = _sanitizeAgregationNames(sanitizedAggregations);
  return _denormalizeAggregations(sanitizedAggregationNames, templates, dictionaries, language);
};

const permissionsInformation = (hit, user) => {
  const { permissions } = hit._source;

  const canWrite = checkWritePermissions(user, permissions);

  return canWrite ? permissions : undefined;
};

const processResponse = async (response, templates, dictionaries, language, filters) => {
  const user = permissionsContext.getUserInContext();
  const rows = response.body.hits.hits.map(hit => {
    const result = hit._source;
    result._explanation = hit._explanation;
    result.snippets = snippetsFromSearchHit(hit);
    result._id = hit._id;
    result.permissions = permissionsInformation(hit, user);
    return result;
  });

  const sanitizedAggregations = await _sanitizeAggregations(
    response.body.aggregations.all,
    templates,
    dictionaries,
    language
  );

  const aggregationsWithAny = _addAnyAggregation(sanitizedAggregations, filters, response);

  return {
    rows,
    totalRows: response.body.hits.total.value,
    relation: response.body.hits.total.relation,
    aggregations: { all: aggregationsWithAny },
  };
};

const determineInheritedProperties = templates =>
  templates.reduce((memo, template) => {
    const inheritedProperties = memo;
    template.properties.forEach(property => {
      if (property.type === 'relationship' && property.inherit) {
        const contentTemplate = templates.find(
          t => t._id.toString() === property.content.toString()
        );
        const inheritedProperty = contentTemplate.properties.find(
          p => p.type === 'geolocation' && p._id.toString() === property.inheritProperty.toString()
        );
        if (inheritedProperty) {
          inheritedProperties[template._id.toString()] =
            inheritedProperties[template._id.toString()] || {};
          inheritedProperties[template._id.toString()][property.name] = {
            base: property,
            target: inheritedProperty,
          };
        }
      }
    });
    return inheritedProperties;
  }, {});

const whatToFetchByTemplate = (baseResults, templatesInheritedProperties) => {
  const toFetchByTemplate = {};

  baseResults.rows.forEach(row => {
    Object.keys(row.metadata || {}).forEach(name => {
      if (Object.keys(templatesInheritedProperties[row.template.toString()] || []).includes(name)) {
        const inheritedProperty = templatesInheritedProperties[row.template.toString()][name];
        const template = inheritedProperty.base.content;
        toFetchByTemplate[template] = toFetchByTemplate[template] || {
          entities: [],
          properties: [],
        };
        toFetchByTemplate[template].entities = toFetchByTemplate[template].entities.concat(
          row.metadata[name].map(mo => mo.value)
        );
        if (!toFetchByTemplate[template].properties.includes(inheritedProperty.target.name)) {
          toFetchByTemplate[template].properties.push(inheritedProperty.target.name);
        }
      }
    });
  });

  return toFetchByTemplate;
};

const getInheritedEntitiesData = async (toFetchByTemplate, language, user) =>
  Promise.all(
    Object.keys(toFetchByTemplate).map(t => {
      const query = { language, sharedId: { $in: toFetchByTemplate[t].entities } };
      if (!user) {
        query.published = true;
      }
      return entities.get(query, {
        ...toFetchByTemplate[t].properties.reduce(
          (memo, n) =>
            Object.assign(memo, { [`metadata.${n}.value`]: true, [`metadata.${n}.label`]: true }),
          {}
        ),
        sharedId: true,
        title: true,
      });
    })
  );

const getInheritedEntities = async (results, language, user) => {
  const templates = await templatesModel.get();
  const templatesInheritedProperties = determineInheritedProperties(templates);
  const toFetchByTemplate = whatToFetchByTemplate(results, templatesInheritedProperties);
  const inheritedEntitiesData = await getInheritedEntitiesData(toFetchByTemplate, language, user);
  const inheritedEntities = inheritedEntitiesData.reduce((_memo, templateEntities) => {
    const memo = _memo;
    templateEntities.forEach(e => {
      memo[e.sharedId] = e;
    });
    return memo;
  }, {});

  return { templatesInheritedProperties, inheritedEntities };
};

const entityHasGeolocation = entity =>
  entity.metadata &&
  !!Object.keys(entity.metadata)
    .filter(field => entity.metadata[field])
    .find(field => {
      if (/_geolocation/.test(field) && entity.metadata[field].length) {
        return true;
      }
      if (Array.isArray(entity.metadata[field])) {
        return !!entity.metadata[field].find(
          f => f.inherit_geolocation && f.inherit_geolocation.length
        );
      }
      return false;
    });

const processGeolocationResults = (_results, templatesInheritedProperties, inheritedEntities) => {
  const results = _results;
  const processedRows = [];
  const affectedTemplates = Object.keys(templatesInheritedProperties);

  results.rows.forEach(_row => {
    const row = _row;
    if (affectedTemplates.includes(row.template)) {
      Object.keys(row.metadata).forEach(property => {
        if (templatesInheritedProperties[row.template][property]) {
          row.metadata[property].forEach(({ value: entity }, index) => {
            const targetProperty = templatesInheritedProperties[row.template][property].target.name;
            const inherited = inheritedEntities[entity]
              ? inheritedEntities[entity]
              : { metadata: {} };
            inherited.metadata = inherited.metadata || {};
            row.metadata[property][index] = row.metadata[property][index] || {};
            row.metadata[property][index] = {
              ...row.metadata[property][index],
              value: entity,
              // geolocation may not be sanitized...
              inherit_geolocation: (inherited.metadata[targetProperty] || []).filter(p => p.value),
            };
          });
        }
      });
    }
    if (entityHasGeolocation(row)) {
      processedRows.push(row);
    }
  });

  results.rows = processedRows;
  results.totalRows = processedRows.length;
  return results;
};

const _getTextFields = (query, templates) =>
  query.fields ||
  propertiesHelper
    .allUniqueProperties(templates)
    .map(prop =>
      ['text', 'markdown'].includes(prop.type)
        ? `metadata.${prop.name}.value`
        : `metadata.${prop.name}.label`
    )
    .concat(['title', 'fullText']);

async function searchTypeFromSearchTermValidity(searchTerm) {
  const validationResult = await elastic.indices.validateQuery({
    body: { query: { query_string: { query: searchTerm } } },
  });
  return validationResult.body.valid ? 'query_string' : 'simple_query_string';
}

const buildQuery = async (query, language, user, resources) => {
  const [templates, dictionaries] = resources;
  const textFieldsToSearch = _getTextFields(query, templates);
  const searchTextType = query.searchTerm
    ? await searchTypeFromSearchTermValidity(query.searchTerm)
    : 'query_string';
  const queryBuilder = documentQueryBuilder()
    .fullTextSearch(query.searchTerm, textFieldsToSearch, 2, searchTextType)
    .filterByTemplate(query.types)
    .filterById(query.ids)
    .language(language)
    .filterByPermissions(user);

  if (Number.isInteger(parseInt(query.from, 10))) {
    queryBuilder.from(query.from);
  }

  if (Number.isInteger(parseInt(query.limit, 10))) {
    queryBuilder.limit(query.limit);
  }

  if (query.includeUnpublished && user && !query.unpublished) {
    queryBuilder.includeUnpublished();
  }

  if (query.unpublished && user) {
    queryBuilder.onlyUnpublished();
  }

  const allUniqueProps = propertiesHelper.allUniqueProperties(templates);
  if (query.sort) {
    const sortingProp = allUniqueProps.find(p => `metadata.${p.name}` === query.sort);
    if (sortingProp && sortingProp.type === 'select') {
      queryBuilder.sort(query.sort, query.order, true);
    } else {
      queryBuilder.sort(query.sort, query.order);
    }
  }

  const allTemplates = templates.map(t => t._id);
  const filteringTypes = query.types && query.types.length ? query.types : allTemplates;
  let properties =
    !query.types || !query.types.length
      ? propertiesHelper.defaultFilters(templates)
      : propertiesHelper.comonFilters(templates, filteringTypes);

  if (query.allAggregations) {
    properties = allUniqueProps;
  }

  // this is where we decide which aggregations to send to elastic
  const aggregations = aggregationProperties(properties);

  const filters = processFilters(query.filters, [...allUniqueProps, ...properties]);
  // this is where the query filters are built
  queryBuilder.filterMetadata(filters);
  queryBuilder.customFilters(query.customFilters);
  // this is where the query aggregations are built
  queryBuilder.aggregations(aggregations, dictionaries);

  return queryBuilder;
};

const search = {
  async search(query, language, user) {
    const resources = await Promise.all([templatesModel.get(), dictionariesModel.get()]);
    const [templates, dictionaries] = resources;
    const queryBuilder = await buildQuery(query, language, user, resources);
    if (query.geolocation) {
      searchGeolocation(queryBuilder, templates);
    }

    if (query.permissionsByLevel) {
      queryBuilder.permissionsLevelAgreggations();
    }

    if (query.aggregateGeneratedToc) {
      queryBuilder.generatedTOCAggregations();
    }

    return elastic
      .search({ body: queryBuilder.query() })
      .then(response => processResponse(response, templates, dictionaries, language, query.filters))
      .catch(e => {
        throw createError(e, 400);
      });
  },

  async searchGeolocations(query, language, user) {
    let results = await this.search({ ...query, geolocation: true }, language, user);

    if (results.rows.length) {
      const { templatesInheritedProperties, inheritedEntities } = await getInheritedEntities(
        results,
        language,
        user
      );
      results = processGeolocationResults(results, templatesInheritedProperties, inheritedEntities);
    }

    return results;
  },

  async searchSnippets(searchTerm, sharedId, language, user) {
    const templates = await templatesModel.get();

    const searchTextType = searchTerm
      ? await searchTypeFromSearchTermValidity(searchTerm)
      : 'query_string';
    const searchFields = propertiesHelper
      .textFields(templates)
      .map(prop => `metadata.${prop.name}.value`)
      .concat(['title', 'fullText']);
    const query = documentQueryBuilder()
      .fullTextSearch(searchTerm, searchFields, 9999, searchTextType)
      .filterById(sharedId)
      .language(language);

    if (user) {
      query.includeUnpublished();
    }

    const response = await elastic.search({
      body: query.query(),
    });

    if (response.body.hits.hits.length === 0) {
      return {
        count: 0,
        metadata: [],
        fullText: [],
      };
    }
    return snippetsFromSearchHit(response.body.hits.hits[0]);
  },

  async indexEntities(query, select = '', limit, batchCallback = () => {}) {
    return indexEntities({
      query,
      select,
      limit,
      batchCallback,
      searchInstance: this,
    });
  },

  async bulkIndex(docs, action = 'index') {
    return bulkIndex(docs, action);
  },

  bulkDelete(docs) {
    const body = docs.map(doc => ({
      delete: { _id: doc._id },
    }));
    return elastic.bulk({ body });
  },

  delete(entity) {
    const id = entity._id.toString();
    return elastic.delete({ id });
  },

  deleteLanguage(language) {
    const query = { query: { match: { language } } };
    return elastic.deleteByQuery({ body: query });
  },

  async autocompleteAggregations(query, language, propertyName, searchTerm, user) {
    const [templates, dictionaries] = await Promise.all([
      templatesModel.get(),
      dictionariesModel.get(),
    ]);

    const queryBuilder = await buildQuery({ ...query, limit: 0 }, language, user, [
      templates,
      dictionaries,
    ]);

    const property = propertiesHelper
      .allUniqueProperties(templates)
      .find(p => p.name === propertyName);

    queryBuilder
      .resetAggregations()
      .aggregations([{ ...property, name: `${propertyName}.value` }], dictionaries);

    const body = queryBuilder.query();

    const aggregation = body.aggregations.all.aggregations[`${propertyName}.value`];

    aggregation.aggregations.filtered.filter.bool.filter.push({
      wildcard: { [`metadata.${propertyName}.label`]: { value: `*${searchTerm.toLowerCase()}*` } },
    });

    const response = await elastic.search({
      body,
    });

    const sanitizedAggregations = await _sanitizeAggregations(
      response.body.aggregations.all,
      templates,
      dictionaries,
      language,
      preloadOptionsSearch
    );

    const options = sanitizedAggregations[propertyName].buckets
      .map(bucket => ({
        label: bucket.label,
        value: bucket.key,
        icon: bucket.icon,
        results: bucket.filtered.doc_count,
      }))
      .filter(o => o.results);

    const filteredOptions = filterOptions(searchTerm, options);
    return {
      options: filteredOptions.slice(0, preloadOptionsLimit),
      count: filteredOptions.length,
    };
  },

  async autocomplete(searchTerm, language, templates = [], includeUnpublished = false) {
    const publishedFilter = includeUnpublished ? undefined : { term: { published: true } };

    const body = {
      _source: {
        include: ['title', 'template', 'sharedId', 'icon'],
      },
      from: 0,
      size: preloadOptionsSearch,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: searchTerm,
                type: 'bool_prefix',
                fields: ['title.sayt', 'title.sayt._2gram', 'title.sayt._3gram'],
              },
            },
          ],
          filter: [publishedFilter, { term: { language } }],
        },
      },
      sort: [],
    };

    if (templates.length) {
      body.query.bool.must.push({
        terms: {
          template: templates,
        },
      });
    }

    const response = await elastic.search({ body });

    const options = response.body.hits.hits.slice(0, preloadOptionsLimit).map(hit => ({
      value: hit._source.sharedId,
      label: hit._source.title,
      template: hit._source.template,
      icon: hit._source.icon,
    }));

    return { count: response.body.hits.hits.length, options };
  },

  async updateTemplatesMapping() {
    const templates = await templatesModel.get();
    return updateMapping(templates);
  },
};

export { search };
