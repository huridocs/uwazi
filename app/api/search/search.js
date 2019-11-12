/** @format */

import errorLog from 'api/log/errorLog';
import date from 'api/utils/date';

import propertiesHelper from 'shared/comonProperties';

import translate, { getLocaleTranslation, getContext } from 'shared/translate';
import translations from 'api/i18n/translations';
import elasticIndexes from 'api/config/elasticIndexes';

import languagesUtil from 'shared/languages';
import languages from 'shared/languagesList';

import dictionariesModel from 'api/thesauris/dictionariesModel';
import { createError } from 'api/utils';
import relationtypes from 'api/relationtypes';
import documentQueryBuilder from './documentQueryBuilder';
import elastic from './elastic';
import entities from '../entities';
import templatesModel from '../templates';

function processFiltes(filters, properties) {
  return Object.keys(filters || {}).map(propertyName => {
    const property = properties.find(p => p.name === propertyName);
    let { type } = property;
    const value = filters[property.name];
    if (property.type === 'date' || property.type === 'multidate' || property.type === 'numeric') {
      type = 'range';
    }
    if (
      property.type === 'select' ||
      property.type === 'multiselect' ||
      property.type === 'relationship'
    ) {
      type = 'multiselect';
    }
    if (property.type === 'multidaterange' || property.type === 'daterange') {
      type = 'nestedrange';
    }

    if (['multidaterange', 'daterange', 'date', 'multidate'].includes(property.type)) {
      value.from = date.descriptionToTimestamp(value.from);
      value.to = date.descriptionToTimestamp(value.to);
    }

    if (property.type === 'relationshipfilter') {
      return {
        ...property,
        value,
        type,
        filters: property.filters.map(f => ({ ...f, name: `${f.name}.value` })),
      };
    }

    return { ...property, value, type, name: `${property.name}.value` };
  });
}

function filtersBasedOnSearchTerm(properties, entitiesMatchedByTitle, dictionariesMatchByLabel) {
  if (!entitiesMatchedByTitle.length && !dictionariesMatchByLabel.length) {
    return [];
  }
  let values = entitiesMatchedByTitle.map(item => item.sharedId);
  values = values.concat(dictionariesMatchByLabel.map(dictionary => dictionary.values.id));
  return properties
    .map(prop => {
      if (prop.type === 'select' || prop.type === 'multiselect') {
        return { name: prop.name, value: { values }, type: 'multiselect' };
      }
    })
    .filter(f => f);
}

function agregationProperties(properties) {
  return properties
    .filter(
      property =>
        property.type === 'select' ||
        property.type === 'multiselect' ||
        property.type === 'relationship' ||
        property.type === 'relationshipfilter' ||
        property.type === 'nested'
    )
    .map(property => {
      if (property.type === 'relationshipfilter') {
        return {
          ...property,
          filters: property.filters.map(f => ({ ...f, name: `${f.name}.value` })),
        };
      }
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
        geolocationProperties.push(prop.name);
      }

      if (prop.type === 'relationship' && prop.inherit) {
        const contentTemplate = templates.find(t => t._id.toString() === prop.content.toString());
        const inheritedProperty = contentTemplate.properties.find(
          p => p._id.toString() === prop.inheritProperty.toString()
        );
        if (inheritedProperty.type === 'geolocation') {
          geolocationProperties.push(prop.name);
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

const processResponse = response => {
  const rows = response.hits.hits.map(hit => {
    const result = hit._source;
    result._explanation = hit._explanation;
    result.snippets = snippetsFromSearchHit(hit);
    result._id = hit._id;
    return result;
  });

  Object.keys(response.aggregations.all).forEach(aggregationKey => {
    const aggregation = response.aggregations.all[aggregationKey];
    if (aggregation.buckets && !Array.isArray(aggregation.buckets)) {
      aggregation.buckets = Object.keys(aggregation.buckets).map(key =>
        Object.assign({ key }, aggregation.buckets[key])
      );
    }
    if (aggregation.buckets) {
      response.aggregations.all[aggregationKey] = aggregation;
    }
    if (!aggregation.buckets) {
      Object.keys(aggregation).forEach(key => {
        if (aggregation[key].buckets) {
          const buckets = aggregation[key].buckets.map(option =>
            Object.assign({ key: option.key }, option.filtered.total)
          );
          response.aggregations.all[key] = {
            doc_count: aggregation[key].doc_count,
            buckets,
          };
        }
      });
    }
  });

  response.aggregations.all = Object.keys(response.aggregations.all).reduce(
    (allAgregations, key) => {
      allAgregations[key.replace('.value', '')] = response.aggregations.all[key];
      return allAgregations;
    },
    {}
  );
  return { rows, totalRows: response.hits.total.value, aggregations: response.aggregations };
};

const mainSearch = (query, language, user) => {
  let searchEntitiesbyTitle = Promise.resolve([]);
  let searchDictionariesByTitle = Promise.resolve([]);
  if (query.searchTerm) {
    searchEntitiesbyTitle = entities.get(
      { $text: { $search: query.searchTerm }, language },
      'sharedId',
      { limit: 5 }
    );
    const regexp = `.*${query.searchTerm}.*`;
    searchDictionariesByTitle = dictionariesModel.db.aggregate([
      { $match: { 'values.label': { $regex: regexp, $options: 'i' } } },
      { $unwind: '$values' },
      { $match: { 'values.label': { $regex: regexp, $options: 'i' } } },
    ]);
  }

  return Promise.all([
    templatesModel.get(),
    searchEntitiesbyTitle,
    searchDictionariesByTitle,
    dictionariesModel.get(),
    relationtypes.get(),
    translations.get(),
  ]).then(
    ([
      templates,
      entitiesMatchedByTitle,
      dictionariesMatchByLabel,
      dictionaries,
      relationTypes,
      _translations,
    ]) => {
      const textFieldsToSearch =
        query.fields ||
        propertiesHelper
          .allUniqueProperties(templates)
          .map(prop =>
            ['text', 'markdown'].includes(prop.type)
              ? `metadata.${prop.name}.value`
              : `metadata.${prop.name}.label`
          )
          .concat(['title', 'fullText']);
      const documentsQuery = documentQueryBuilder()
        .fullTextSearch(query.searchTerm, textFieldsToSearch, 2)
        .filterByTemplate(query.types)
        .filterById(query.ids)
        .language(language);

      if (query.from) {
        documentsQuery.from(query.from);
      }

      if (query.limit) {
        documentsQuery.limit(query.limit);
      }

      if (query.includeUnpublished && user) {
        documentsQuery.includeUnpublished();
      }

      if (query.unpublished && user) {
        documentsQuery.unpublished();
      }

      const allTemplates = templates.map(t => t._id);
      const allUniqueProps = propertiesHelper.allUniqueProperties(templates);
      const filteringTypes = query.types && query.types.length ? query.types : allTemplates;
      let properties = propertiesHelper.comonFilters(templates, relationTypes, filteringTypes);
      properties =
        !query.types || !query.types.length
          ? propertiesHelper.defaultFilters(templates)
          : properties;

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
          documentsQuery.sortByForeignKey(query.sort, keys, query.order);
        } else {
          documentsQuery.sort(query.sort, query.order);
        }
      }

      if (query.allAggregations) {
        properties = allUniqueProps;
      }

      const aggregations = agregationProperties(properties);
      const filters = processFiltes(query.filters, properties);
      // const textSearchFilters = filtersBasedOnSearchTerm(
      //   allUniqueProps,
      //   entitiesMatchedByTitle,
      //   dictionariesMatchByLabel
      // );

      // documentsQuery.filterMetadataByFullText(textSearchFilters);
      documentsQuery.filterMetadata(filters);
      documentsQuery.aggregations(aggregations, dictionaries);

      if (query.geolocation) {
        searchGeolocation(documentsQuery, templates);
      }

      return elastic
        .search({ index: elasticIndexes.index, body: documentsQuery.query() })
        .then(processResponse)
        .catch(e => {
          throw createError(e.message, 400);
        });
    }
  );
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

const getInheritedEntitiesData = async (toFetchByTemplate, language, user) => {
  return Promise.all(
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
};

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

const search = {
  search: mainSearch,

  async searchGeolocations(query, language, user) {
    let results = await mainSearch({ ...query, geolocation: true }, language, user);

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

  searchSnippets(searchTerm, sharedId, language) {
    return Promise.all([templatesModel.get()]).then(([templates]) => {
      const searchFields = propertiesHelper
        .textFields(templates)
        .map(prop => `metadata.${prop.name}.value`)
        .concat(['title', 'fullText']);
      const query = documentQueryBuilder()
        .fullTextSearch(searchTerm, searchFields, 9999)
        .includeUnpublished()
        .filterById(sharedId)
        .language(language)
        .query();

      return elastic.search({ index: elasticIndexes.index, body: query }).then(response => {
        if (response.hits.hits.length === 0) {
          return {
            count: 0,
            metadata: [],
            fullText: [],
          };
        }
        return snippetsFromSearchHit(response.hits.hits[0]);
      });
    });
  },

  bulkIndex(docs, _action = 'index') {
    const body = [];
    docs.forEach(doc => {
      let docBody = Object.assign({}, doc);
      docBody.fullText = 'entity';
      const id = doc._id.toString();
      delete docBody._id;
      delete docBody._rev;
      delete docBody.pdfInfo;

      let action = {};
      action[_action] = { _index: elasticIndexes.index, _id: id };
      if (_action === 'update') {
        docBody = { doc: docBody };
      }

      body.push(action);
      body.push(docBody);

      if (doc.fullText) {
        const fullText = Object.values(doc.fullText).join('\f');

        action = {};
        action[_action] = {
          _index: elasticIndexes.index,
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
  },

  bulkDelete(docs) {
    const type = 'entity';
    const body = docs.map(doc => ({
      delete: { _index: elasticIndexes.index, _type: type, _id: doc._id },
    }));
    return elastic.bulk({ body });
  },

  delete(entity) {
    const id = entity._id.toString();
    return elastic.delete({ index: elasticIndexes.index, type: 'entity', id });
  },

  deleteLanguage(language) {
    const query = { query: { match: { language } } };
    return elastic.deleteByQuery({ index: elasticIndexes.index, body: query });
  },
};
export default search;
