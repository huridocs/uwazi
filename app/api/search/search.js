import {comonProperties, defaultFilters, allUniqueProperties, textFields} from 'shared/comonProperties';
import {detect as detectLanguage} from 'shared/languages';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import languages from 'shared/languagesList';
import dictionaries from 'api/thesauris/dictionariesModel';

import documentQueryBuilder from './documentQueryBuilder';
import elastic from './elastic';
import entities from '../entities';
import templatesModel from '../templates';

function processFiltes(filters, properties) {
  return Object.keys(filters || {}).map((propertyName) => {
    let property = properties.find((p) => p.name === propertyName);
    let type = 'text';
    if (property.type === 'date' || property.type === 'multidate' || property.type === 'numeric') {
      type = 'range';
    }
    if (property.type === 'select' || property.type === 'multiselect' || property.type === 'relationship') {
      type = 'multiselect';
    }
    if (property.type === 'nested') {
      type = 'nested';
    }
    if (property.type === 'multidaterange' || property.type === 'daterange') {
      type = 'nestedrange';
    }
    return Object.assign(property, {value: filters[property.name], type});
  });
}

function filtersBasedOnSearchTerm(properties, entitiesMatchedByTitle, dictionariesMatchByLabel) {
  if (!entitiesMatchedByTitle.length && !dictionariesMatchByLabel.length) {
    return [];
  }
  let values = entitiesMatchedByTitle.map((item) => item.sharedId);
  values = values.concat(dictionariesMatchByLabel.map((dictionary) => dictionary.values.id));
  return properties.map((prop) => {
    if (prop.type === 'select' || prop.type === 'multiselect') {
      return {name: prop.name, value: {values}, type: 'multiselect'};
    }
  }).filter((f) => f);
}

function agregationProperties(properties) {
  return properties
  .filter((property) => property.type === 'select' ||
    property.type === 'multiselect' ||
    property.type === 'relationship' ||
    property.type === 'nested')
  .map((property) => {
    if (property.type === 'nested') {
      return {name: property.name, nested: true, nestedProperties: property.nestedProperties};
    }
    return {name: property.name, nested: false};
  });
}

const search = {
  search(query, language, user) {
    let searchEntitiesbyTitle = Promise.resolve([]);
    let searchDictionariesByTitle = Promise.resolve([]);
    if (query.searchTerm) {
      searchEntitiesbyTitle = entities.get({$text: {$search: query.searchTerm}, language});
      let regexp = `.*${query.searchTerm}.*`;
      searchDictionariesByTitle = dictionaries.db.aggregate([
        {$match: {'values.label': {$regex: regexp, $options: 'i'}}},
        {$unwind: '$values'},
        {$match: {'values.label': {$regex: regexp, $options: 'i'}}}
      ]);
    }

    return Promise.all([templatesModel.get(), searchEntitiesbyTitle, searchDictionariesByTitle])
    .then(([templates, entitiesMatchedByTitle, dictionariesMatchByLabel]) => {
      let textFieldsToSearch = query.fields || textFields(templates).map((prop) => 'metadata.' + prop.name).concat(['title', 'fullText']);
      let documentsQuery = documentQueryBuilder()
      .fullTextSearch(query.searchTerm, textFieldsToSearch, 2)
      .filterByTemplate(query.types)
      .filterById(query.ids)
      .language(language);

      if (query.sort) {
        documentsQuery.sort(query.sort, query.order);
      }

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

      const allTemplates = templates.map((t) => t._id);
      const filteringTypes = query.types && query.types.length ? query.types : allTemplates;
      let properties = comonProperties(templates, filteringTypes);
      properties = !query.types || !query.types.length ? defaultFilters(templates) : properties;

      const aggregations = agregationProperties(properties);
      const filters = processFiltes(query.filters, properties);
      const textSearchFilters = filtersBasedOnSearchTerm(allUniqueProperties(templates), entitiesMatchedByTitle, dictionariesMatchByLabel);

      documentsQuery.filterMetadataByFullText(textSearchFilters);
      documentsQuery.filterMetadata(filters);
      documentsQuery.aggregations(aggregations);

      return elastic.search({index: elasticIndex, body: documentsQuery.query()})
      .then((response) => {
        let rows = response.hits.hits.map((hit) => {
          let result = hit._source;
          result.snippets = [];
          if (hit.inner_hits && hit.inner_hits.fullText.hits.hits.length) {
            const regex = /\[\[(\d+)\]\]/g;

            let highlights = hit.inner_hits.fullText.hits.hits[0].highlight;

            result.snippets = highlights[Object.keys(highlights)[0]].map((snippet) => {
              const matches = regex.exec(snippet);
              return {
                text: snippet.replace(regex, ''),
                page: matches ? Number(matches[1]) : 0
              };
            });
          }
          result._id = hit._id;
          return result;
        });

        return {rows, totalRows: response.hits.total, aggregations: response.aggregations};
      });
    });
  },

  getUploadsByUser(user, language) {
    return entities.get({user: user._id, language, published: false});
  },

  searchSnippets(searchTerm, sharedId, language) {
    let query = documentQueryBuilder()
    .fullTextSearch(searchTerm, ['fullText'], 9999)
    .includeUnpublished()
    .filterById(sharedId)
    .language(language)
    .query();

    return elastic.search({index: elasticIndex, body: query})
    .then((response) => {
      if (response.hits.hits.length === 0) {
        return [];
      }

      if (!response.hits.hits[0].inner_hits) {
        return [];
      }

      let highlights = response.hits.hits[0].inner_hits.fullText.hits.hits[0].highlight;

      const regex = /\[\[(\d+)\]\]/g;
      return highlights[Object.keys(highlights)[0]].map((snippet) => {
        const matches = regex.exec(snippet);
        return {
          text: snippet.replace(regex, ''),
          page: matches ? Number(matches[1]) : 0
        };
      });
    });
  },

  index(_entity) {
    const entity = Object.assign({}, _entity);
    const id = entity._id.toString();
    delete entity._id;
    delete entity._rev;
    delete entity.pdfInfo;

    const body = entity;
    let fullTextIndex = Promise.resolve();
    if (entity.fullText) {
      const fullText = {};
      let language;
      if (!entity.file || entity.file && !entity.file.language) {
        language = detectLanguage(entity.fullText);
      }
      if (entity.file && entity.file.language) {
        language = languages(entity.file.language);
      }

      fullText['fullText_' + language] = entity.fullText;
      fullTextIndex = elastic.index({index: elasticIndex, type: 'fullText', parent: id, body: fullText, id: `${id}_fullText`});
      delete entity.fullText;
    }
    return Promise.all([
      elastic.index({index: elasticIndex, type: 'entity', id, body}),
      fullTextIndex
    ]);
  },

  bulkIndex(docs, _action = 'index') {
    const type = 'entity';
    let body = [];
    docs.forEach((doc) => {
      let _doc = doc;
      const id = doc._id.toString();
      delete doc._id;
      delete doc._rev;
      delete doc.pdfInfo;

      let action = {};
      action[_action] = {_index: elasticIndex, _type: type, _id: id};
      if (_action === 'update') {
        _doc = {doc: _doc};
      }

      body.push(action);
      body.push(_doc);

      if (doc.fullText) {
        action = {};
        action[_action] = {_index: elasticIndex, _type: 'fullText', parent: id, _id: `${id}_fullText`};
        body.push(action);

        const fullText = {};
        let language;
        if (!doc.file || doc.file && !doc.file.language) {
          language = detectLanguage(doc.fullText);
        }
        if (doc.file && doc.file.language) {
          language = languages(doc.file.language);
        }
        fullText['fullText_' + language] = doc.fullText;
        body.push(fullText);
        delete doc.fullText;
      }
    });

    return elastic.bulk({body})
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
    return elastic.delete({index: elasticIndex, type: 'entity', id});
  }
};

export default search;
