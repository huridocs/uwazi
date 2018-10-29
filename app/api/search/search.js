import { comonFilters, defaultFilters, allUniqueProperties, textFields } from 'shared/comonProperties';
import { detect as detectLanguage } from 'shared/languages';
import translate, { getLocaleTranslation, getContext } from 'shared/translate';
import translations from 'api/i18n/translations';
import { index as elasticIndex } from 'api/config/elasticIndexes';
import languages from 'shared/languagesList';
import dictionariesModel from 'api/thesauris/dictionariesModel';
import { createError } from 'api/utils';
import relationtypes from 'api/relationtypes';
import documentQueryBuilder from './documentQueryBuilder';
import elastic from './elastic';
import entities from '../entities';
import templatesModel from '../templates';


function processFiltes(filters, properties) {
  return Object.keys(filters || {}).map((propertyName) => {
    const property = properties.find(p => p.name === propertyName);
    let { type } = property;
    if (property.type === 'date' || property.type === 'multidate' || property.type === 'numeric') {
      type = 'range';
    }
    if (property.type === 'select' || property.type === 'multiselect' || property.type === 'relationship') {
      type = 'multiselect';
    }
    if (property.type === 'multidaterange' || property.type === 'daterange') {
      type = 'nestedrange';
    }
    return Object.assign(property, { value: filters[property.name], type });
  });
}

function filtersBasedOnSearchTerm(properties, entitiesMatchedByTitle, dictionariesMatchByLabel) {
  if (!entitiesMatchedByTitle.length && !dictionariesMatchByLabel.length) {
    return [];
  }
  let values = entitiesMatchedByTitle.map(item => item.sharedId);
  values = values.concat(dictionariesMatchByLabel.map(dictionary => dictionary.values.id));
  return properties.map((prop) => {
    if (prop.type === 'select' || prop.type === 'multiselect') {
      return { name: prop.name, value: { values }, type: 'multiselect' };
    }
  }).filter(f => f);
}

function agregationProperties(properties) {
  return properties
  .filter(property => property.type === 'select' ||
    property.type === 'multiselect' ||
    property.type === 'relationship' ||
    property.type === 'relationshipfilter' ||
    property.type === 'nested');
}

function metadataSnippetsFromSearchHit(hit) {
  const defaultSnippets = { count: 0, snippets: [] };
  if (hit.highlight) {
    const metadataHighlights = hit.highlight;
    const metadataSnippets = Object.keys(metadataHighlights).reduce((foundSnippets, field) => {
      const fieldSnippets = { field, texts: metadataHighlights[field] };
      return {
        count: foundSnippets.count + fieldSnippets.texts.length,
        snippets: [...foundSnippets.snippets, fieldSnippets]
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
    const fullTextSnippets = fullTextHighlights[fullTextLanguageKey].map((snippet) => {
      const matches = regex.exec(snippet);
      return {
        text: snippet.replace(regex, ''),
        page: matches ? Number(matches[1]) : 0
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
    fullText: []
  };

  const metadataSnippets = metadataSnippetsFromSearchHit(hit);
  const fullTextSnippets = fullTextSnippetsFromSearchHit(hit);
  snippets.count = metadataSnippets.count + fullTextSnippets.length;
  snippets.metadata = metadataSnippets.snippets;
  snippets.fullText = fullTextSnippets;

  return snippets;
}

function searchGeolocation(documentsQuery, filteringTypes, templates) {
  documentsQuery.limit(9999);
  const geolocationProperties = [];
  templates.forEach((template) => {
    template.properties.forEach((prop) => {
      if (prop.type === 'geolocation') {
        geolocationProperties.push(prop.name);
      }
    });
  });
  documentsQuery.hasMetadataProperties(geolocationProperties);
  const selectProps = geolocationProperties.map(p => `metadata.${p}`)
  .concat(['title', 'template', 'sharedId', 'language']);
  documentsQuery.select(selectProps);
}

const processResponse = (response) => {
  const rows = response.hits.hits.map((hit) => {
    const result = hit._source;
    result._explanation = hit._explanation;
    result.snippets = snippetsFromSearchHit(hit);
    result._id = hit._id;
    return result;
  });
  Object.keys(response.aggregations.all).forEach((aggregationKey) => {
    const aggregation = response.aggregations.all[aggregationKey];
    if (aggregation.buckets && !Array.isArray(aggregation.buckets)) {
      aggregation.buckets = Object.keys(aggregation.buckets).map(key => Object.assign({ key }, aggregation.buckets[key]));
    }
    if (aggregation.buckets) {
      response.aggregations.all[aggregationKey] = aggregation;
    }
    if (!aggregation.buckets) {
      Object.keys(aggregation).forEach((key) => {
        if (aggregation[key].buckets) {
          const buckets = aggregation[key].buckets.map(option => Object.assign({ key: option.key }, option.filtered.total));
          response.aggregations.all[key] = { doc_count: aggregation[key].doc_count, buckets };
        }
      });
    }
  });

  return { rows, totalRows: response.hits.total, aggregations: response.aggregations };
};

const search = {
  search(query, language, user) {
    let searchEntitiesbyTitle = Promise.resolve([]);
    let searchDictionariesByTitle = Promise.resolve([]);
    if (query.searchTerm) {
      searchEntitiesbyTitle = entities.get({ $text: { $search: query.searchTerm }, language });
      const regexp = `.*${query.searchTerm}.*`;
      searchDictionariesByTitle = dictionariesModel.db.aggregate([
        { $match: { 'values.label': { $regex: regexp, $options: 'i' } } },
        { $unwind: '$values' },
        { $match: { 'values.label': { $regex: regexp, $options: 'i' } } }
      ]);
    }

    return Promise.all([
      templatesModel.get(),
      searchEntitiesbyTitle,
      searchDictionariesByTitle,
      dictionariesModel.get(),
      relationtypes.get(),
      translations.get()
    ])
    .then(([templates, entitiesMatchedByTitle, dictionariesMatchByLabel, dictionaries, relationTypes, translations]) => {
      const textFieldsToSearch = query.fields || textFields(templates).map(prop => `metadata.${prop.name}`).concat(['title', 'fullText']);
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
      const allUniqueProps = allUniqueProperties(templates);
      const filteringTypes = query.types && query.types.length ? query.types : allTemplates;
      let properties = comonFilters(templates, relationTypes, filteringTypes);
      properties = !query.types || !query.types.length ? defaultFilters(templates) : properties;

      if (query.sort) {
        const sortingProp = allUniqueProps.find(p => `metadata.${p.name}` === query.sort);
        if (sortingProp && sortingProp.type === 'select') {
          const dictionary = dictionaries.find(d => d._id.toString() === sortingProp.content);
          const translation = getLocaleTranslation(translations, language);
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
      const textSearchFilters = filtersBasedOnSearchTerm(allUniqueProps, entitiesMatchedByTitle, dictionariesMatchByLabel);


      documentsQuery.filterMetadataByFullText(textSearchFilters);
      documentsQuery.filterMetadata(filters);
      documentsQuery.aggregations(aggregations, dictionaries);

      if (query.geolocation) {
        searchGeolocation(documentsQuery, filteringTypes, templates);
      }
      return elastic.search({ index: elasticIndex, body: documentsQuery.query() })
      .then(processResponse)
      .catch((error) => {
        console.log(error);
        throw createError('Query error', 400);
      });
    });
  },

  getUploadsByUser(user, language) {
    return entities.get({ user: user._id, language, published: false });
  },

  searchSnippets(searchTerm, sharedId, language) {
    return Promise.all([templatesModel.get()])
    .then(([templates]) => {
      const searchFields = textFields(templates).map(prop => `metadata.${prop.name}`).concat(['title', 'fullText']);
      const query = documentQueryBuilder()
      .fullTextSearch(searchTerm, searchFields, 9999)
      .includeUnpublished()
      .filterById(sharedId)
      .language(language)
      .query();

      return elastic.search({ index: elasticIndex, body: query })
      .then((response) => {
        if (response.hits.hits.length === 0) {
          return {
            count: 0,
            metadata: [],
            fullText: []
          };
        }
        return snippetsFromSearchHit(response.hits.hits[0]);
      });
    });
  },

  bulkIndex(docs, _action = 'index') {
    const type = 'entity';
    const body = [];
    docs.forEach((doc) => {
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
        action[_action] = { _index: elasticIndex, _type: 'fullText', parent: id, _id: `${id}_fullText` };
        body.push(action);

        const fullTextQuery = {};
        let language;
        if (!doc.file || doc.file && !doc.file.language) {
          language = detectLanguage(fullText);
        }
        if (doc.file && doc.file.language) {
          language = languages(doc.file.language);
        }
        fullTextQuery[`fullText_${language}`] = fullText;
        body.push(fullTextQuery);
        delete doc.fullText;
      }
    });

    return elastic.bulk({ body })
    .then((res) => {
      if (res.items) {
        res.items.forEach((f) => {
          if (f.index.error) {
            console.log(`ERROR Failed to index document ${f.index._id}: ${JSON.stringify(f.index.error, null, ' ')}`);
          }
        });
      }
      return res;
    });
  },

  delete(entity) {
    const id = entity._id.toString();
    return elastic.delete({ index: elasticIndex, type: 'entity', id });
  }
};

export default search;
