/* eslint-disable max-lines */
import date from 'api/utils/date';

import propertiesHelper from 'shared/comonProperties';

import translate, { getLocaleTranslation, getContext } from 'shared/translate';
import translations from 'api/i18n/translations';
import elasticIndexes from 'api/config/elasticIndexes';

import dictionariesModel from 'api/thesauri/dictionariesModel';
import { createError } from 'api/utils';
import { filterOptions } from 'shared/optionsUtils';
import { preloadOptionsLimit, preloadOptionsSearch } from 'shared/config';
import documentQueryBuilder from './documentQueryBuilder';
import elastic from './elastic';
import entities from '../entities';
import templatesModel from '../templates';
import { bulkIndex, indexEntities } from './entitiesIndex';
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
    .map(property => {
      return { ...property, name: `${property.name}.value` };
    });
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

function fullTextSnippetsFromSearchHit(hit) {
  if (hit.inner_hits && hit.inner_hits.fullText.hits.hits.length) {
    const regex = /\[\[(\d+)\]\]/g;

    const fullTextHighlights = hit.inner_hits.fullText.hits.hits[0].highlight;
    const fullTextLanguageKey = Object.keys(fullTextHighlights)[0];
    const fullTextSnippets = fullTextHighlights[fullTextLanguageKey].map(snippet => {
      const matches = regex.exec(snippet);
      return {
        text: snippet.replace(regex, ''),
        page: matches ? Number(matches[1]) : 0,
      };
    });
    return fullTextSnippets;
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

const _sanitizeAgregationNames = aggregations => {
  return Object.keys(aggregations).reduce((allAggregations, key) => {
    const sanitizedKey = key.replace('.value', '');
    return Object.assign(allAggregations, { [sanitizedKey]: aggregations[key] });
  }, {});
};

const _getAggregationDictionary = async (aggregation, language, property, dictionaries) => {
  if (property.type === 'relationship') {
    const entitiesSharedId = aggregation.buckets.map(bucket => bucket.key);

    const bucketEntities = await entities.get({ sharedId: { $in: entitiesSharedId }, language });

    return thesauri.entitiesToThesauri(bucketEntities);
  }

  return dictionaries.find(dictionary => dictionary._id.toString() === property.content.toString());
};

const _formatDictionaryWithGroupsAggregation = (aggregation, dictionary) => {
  const buckets = dictionary.values.map(dictionaryValue => {
    const bucket = aggregation.buckets.find(b => b.key === dictionaryValue.id);
    if (dictionaryValue.values) {
      bucket.values = dictionaryValue.values.map(v =>
        aggregation.buckets.find(b => b.key === v.id)
      );
    }
    return bucket;
  });
  buckets.push(aggregation.buckets.find(b => b.key === 'missing'));
  return Object.assign(aggregation, { buckets });
};

const _denormalizeAggregations = async (aggregations, templates, dictionaries, language) => {
  const properties = propertiesHelper.allUniqueProperties(templates);
  return Object.keys(aggregations).reduce(async (denormaLizedAgregationsPromise, key) => {
    const denormaLizedAgregations = await denormaLizedAgregationsPromise;
    if (!aggregations[key].buckets || key === '_types' || aggregations[key].type === 'nested') {
      return Object.assign(denormaLizedAgregations, { [key]: aggregations[key] });
    }

    const property = properties.find(prop => prop.name === key || `__${prop.name}` === key);

    const dictionary = await _getAggregationDictionary(
      aggregations[key],
      language,
      property,
      dictionaries
    );

    const buckets = aggregations[key].buckets.map(bucket => {
      const labelItem =
        bucket.key === 'missing'
          ? { label: 'No label' }
          : dictionary.values
              .reduce(
                (values, v) => (v.values ? values.concat(v.values, [v]) : values.concat(v)),
                []
              )
              .find(value => value.id === bucket.key, {});

      const { label, icon } = labelItem;

      return Object.assign(bucket, { label, icon });
    });

    let denormalizedAggregation = Object.assign(aggregations[key], { buckets });
    if (dictionary.values.find(v => v.values)) {
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
    let aggregation = aggregations[aggregationKey];

    //grouped dictionary
    if (aggregation.buckets && !Array.isArray(aggregation.buckets)) {
      aggregation.buckets = Object.keys(aggregation.buckets).map(key =>
        Object.assign({ key }, aggregation.buckets[key])
      );
    }

    //nested
    if (!aggregation.buckets) {
      Object.keys(aggregation).forEach(key => {
        if (aggregation[key].buckets) {
          const buckets = aggregation[key].buckets.map(option =>
            Object.assign({ key: option.key }, option.filtered.total)
          );
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
      aggregation.count = bucketsWithResults.length;
      aggregation.buckets = aggregation.buckets.slice(0, limit);
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
        (typeof response.hits.total === 'object'
          ? response.hits.total.value
          : response.hits.total) -
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

const processResponse = async (response, templates, dictionaries, language, filters) => {
  const rows = response.hits.hits.map(hit => {
    const result = hit._source;
    result._explanation = hit._explanation;
    result.snippets = snippetsFromSearchHit(hit);
    result._id = hit._id;
    return result;
  });

  const sanitizedAggregations = await _sanitizeAggregations(
    response.aggregations.all,
    templates,
    dictionaries,
    language
  );

  const aggregationsWithAny = _addAnyAggregation(sanitizedAggregations, filters, response);

  return {
    rows,
    totalRows: response.hits.total.value,
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
          (memo, n) => Object.assign(memo, { [`metadata.${n}.value`]: 1 }),
          {}
        ),
        sharedId: 1,
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
            row.metadata[property][index] = {
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

const escapeCharByRegex = (query, regex, char) => {
  let escaped = query;

  regex.lastIndex = 0;
  let result = regex.exec(escaped);
  while (result) {
    const firstPart = escaped.substr(0, result.index);
    const charCount = result[1] ? 2 : 1;
    const secondPart = escaped.substr(result.index + charCount, query.length);
    const replacement = `${charCount === 2 ? result[1] : ''}\\${char}`;

    escaped = firstPart + replacement + secondPart;
    regex.lastIndex = 0;
    result = regex.exec(escaped);
  }

  return escaped;
};

const checkCharParity = (query, regex) => {
  const indices = [];

  regex.lastIndex = 0;
  let result = regex.exec(query);
  while (result) {
    indices.push(result.index);
    result = regex.exec(query);
  }

  return !(indices.length % 2 === 1);
};

const escapeElasticSearchQueryString = query => {
  const charsRegex = {
    '"': /([^\\])"|^"/g,
    '/': /([^\\])\/|^\//g,
  };

  return Object.keys(charsRegex).reduce((escaped, char) => {
    if (!checkCharParity(escaped, charsRegex[char])) {
      return escapeCharByRegex(escaped, charsRegex[char], char);
    }
    return escaped;
  }, query);
};

const _getTextFields = (query, templates) => {
  return (
    query.fields ||
    propertiesHelper
      .allUniqueProperties(templates)
      .map(prop =>
        ['text', 'markdown'].includes(prop.type)
          ? `metadata.${prop.name}.value`
          : `metadata.${prop.name}.label`
      )
      .concat(['title', 'fullText'])
  );
};

const buildQuery = async (query, language, user, resources) => {
  const [templates, dictionaries, _translations] = resources;
  const textFieldsToSearch = _getTextFields(query, templates);
  const elasticSearchTerm = query.searchTerm && escapeElasticSearchQueryString(query.searchTerm);
  const queryBuilder = documentQueryBuilder()
    .fullTextSearch(elasticSearchTerm, textFieldsToSearch, 2)
    .filterByTemplate(query.types)
    .filterById(query.ids)
    .language(language);

  if (query.from) {
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
      const dictionary = dictionaries.find(d => d._id.toString() === sortingProp.content);
      const translation = getLocaleTranslation(_translations, language);
      const context = getContext(translation, dictionary._id.toString());
      const keys = dictionary.values.reduce((result, value) => {
        result[value.id] = translate(context, value.label, value.label);
        return result;
      }, {});
      queryBuilder.sortByForeignKey(query.sort, keys, query.order);
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
  // this is where the query aggregations are built
  queryBuilder.aggregations(aggregations, dictionaries);

  return queryBuilder;
};

const instanceSearch = elasticIndex => ({
  async search(query, language, user) {
    const resources = await Promise.all([
      templatesModel.get(),
      dictionariesModel.get(),
      translations.get(),
    ]);
    const [templates, dictionaries] = resources;
    const queryBuilder = await buildQuery(query, language, user, resources);
    if (query.geolocation) {
      searchGeolocation(queryBuilder, templates);
    }

    // queryBuilder.query() is the actual call
    return elastic
      .search({ index: elasticIndex || elasticIndexes.index, body: queryBuilder.query() })
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

  getUploadsByUser(user, language) {
    return entities.get({ user: user._id, language, published: false });
  },

  async searchSnippets(searchTerm, sharedId, language) {
    const templates = await templatesModel.get();

    const elasticSearchTerm = searchTerm && escapeElasticSearchQueryString(searchTerm);

    const searchFields = propertiesHelper
      .textFields(templates)
      .map(prop => `metadata.${prop.name}.value`)
      .concat(['title', 'fullText']);
    const query = documentQueryBuilder()
      .fullTextSearch(elasticSearchTerm, searchFields, 9999)
      .includeUnpublished()
      .filterById(sharedId)
      .language(language)
      .query();

    const response = await elastic.search({
      index: elasticIndex || elasticIndexes.index,
      body: query,
    });
    if (response.hits.hits.length === 0) {
      return {
        count: 0,
        metadata: [],
        fullText: [],
      };
    }
    return snippetsFromSearchHit(response.hits.hits[0]);
  },

  async indexEntities(query, select = '', limit = 200, batchCallback = () => {}) {
    return indexEntities(query, select, limit, {
      batchCallback,
      elasticIndex: elasticIndex || elasticIndexes.index,
      searchInstance: this,
    });
  },

  async bulkIndex(docs, action = 'index', index = elasticIndex) {
    return bulkIndex(docs, action, index);
  },

  bulkDelete(docs) {
    const body = docs.map(doc => ({
      delete: { _index: elasticIndex || elasticIndexes.index, _id: doc._id },
    }));
    return elastic.bulk({ body });
  },

  delete(entity) {
    const id = entity._id.toString();
    return elastic.delete({ index: elasticIndex || elasticIndexes.index, id });
  },

  deleteLanguage(language) {
    const query = { query: { match: { language } } };
    return elastic.deleteByQuery({ index: elasticIndex || elasticIndexes.index, body: query });
  },

  async autocompleteAggregations(query, language, propertyName, searchTerm, user) {
    const [templates, dictionaries, _translations] = await Promise.all([
      templatesModel.get(),
      dictionariesModel.get(),
      translations.get(),
    ]);

    const queryBuilder = await buildQuery({ ...query, limit: 0 }, language, user, [
      templates,
      dictionaries,
      _translations,
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
      index: elasticIndex || elasticIndexes.index,
      body,
    });
    const sanitizedAggregations = await _sanitizeAggregations(
      response.aggregations.all,
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

    const response = await elastic.search({ index: elasticIndex || elasticIndexes.index, body });

    const options = response.hits.hits.slice(0, preloadOptionsLimit).map(hit => ({
      value: hit._source.sharedId,
      label: hit._source.title,
      template: hit._source.template,
      icon: hit._source.icon,
    }));

    return { count: response.hits.hits.length, options };
  },
});

export { instanceSearch };

export default instanceSearch();
