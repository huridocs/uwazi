"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _errorLog = _interopRequireDefault(require("../log/errorLog"));
var _date = _interopRequireDefault(require("../utils/date"));

var _comonProperties = _interopRequireDefault(require("../../shared/comonProperties"));

var _translate = _interopRequireWildcard(require("../../shared/translate"));
var _translations2 = _interopRequireDefault(require("../i18n/translations"));
var _elasticIndexes = _interopRequireDefault(require("../config/elasticIndexes"));

var _languages = _interopRequireDefault(require("../../shared/languages"));
var _languagesList = _interopRequireDefault(require("../../shared/languagesList"));

var _dictionariesModel = _interopRequireDefault(require("../thesauris/dictionariesModel"));
var _utils = require("../utils");
var _relationtypes = _interopRequireDefault(require("../relationtypes"));
var _documentQueryBuilder = _interopRequireDefault(require("./documentQueryBuilder"));
var _elastic = _interopRequireDefault(require("./elastic"));
var _entities = _interopRequireDefault(require("../entities"));
var _templates = _interopRequireDefault(require("../templates"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function processFiltes(filters, properties) {
  return Object.keys(filters || {}).map(propertyName => {
    const property = properties.find(p => p.name === propertyName);
    let { type } = property;
    const value = filters[property.name];
    if (property.type === 'date' || property.type === 'multidate' || property.type === 'numeric') {
      type = 'range';
    }
    if (property.type === 'select' || property.type === 'multiselect' || property.type === 'relationship') {
      type = 'multiselect';
    }
    if (property.type === 'multidaterange' || property.type === 'daterange') {
      type = 'nestedrange';
    }

    if (['multidaterange', 'daterange', 'date', 'multidate'].includes(property.type)) {
      value.from = _date.default.descriptionToTimestamp(value.from);
      value.to = _date.default.descriptionToTimestamp(value.to);
    }
    return Object.assign(property, { value, type });
  });
}

function filtersBasedOnSearchTerm(properties, entitiesMatchedByTitle, dictionariesMatchByLabel) {
  if (!entitiesMatchedByTitle.length && !dictionariesMatchByLabel.length) {
    return [];
  }
  let values = entitiesMatchedByTitle.map(item => item.sharedId);
  values = values.concat(dictionariesMatchByLabel.map(dictionary => dictionary.values.id));
  return properties.map(prop => {
    if (prop.type === 'select' || prop.type === 'multiselect') {
      return { name: prop.name, value: { values }, type: 'multiselect' };
    }
  }).filter(f => f);
}

function agregationProperties(properties) {
  return properties.
  filter(property => property.type === 'select' ||
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
        snippets: [...foundSnippets.snippets, fieldSnippets] };

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
        page: matches ? Number(matches[1]) : 0 };

    });
    return fullTextSnippets;
  }
  return [];
}

function snippetsFromSearchHit(hit) {
  const snippets = {
    count: 0,
    metadata: [],
    fullText: [] };


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

  templates.forEach(template => {
    template.properties.forEach(prop => {
      if (prop.type === 'geolocation') {
        geolocationProperties.push(prop.name);
      }

      if (prop.type === 'relationship' && prop.inherit) {
        const contentTemplate = templates.find(t => t._id.toString() === prop.content.toString());
        const inheritedProperty = contentTemplate.properties.find(p => p._id.toString() === prop.inheritProperty.toString());
        if (inheritedProperty.type === 'geolocation') {
          geolocationProperties.push(prop.name);
        }
      }
    });
  });

  documentsQuery.hasMetadataProperties(geolocationProperties);

  const selectProps = geolocationProperties.map(p => `metadata.${p}`).concat(['title', 'template', 'sharedId', 'language']);

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
      aggregation.buckets = Object.keys(aggregation.buckets).map(key => Object.assign({ key }, aggregation.buckets[key]));
    }
    if (aggregation.buckets) {
      response.aggregations.all[aggregationKey] = aggregation;
    }
    if (!aggregation.buckets) {
      Object.keys(aggregation).forEach(key => {
        if (aggregation[key].buckets) {
          const buckets = aggregation[key].buckets.map(option => Object.assign({ key: option.key }, option.filtered.total));
          response.aggregations.all[key] = { doc_count: aggregation[key].doc_count, buckets };
        }
      });
    }
  });

  return { rows, totalRows: response.hits.total, aggregations: response.aggregations };
};

const mainSearch = (query, language, user) => {
  let searchEntitiesbyTitle = Promise.resolve([]);
  let searchDictionariesByTitle = Promise.resolve([]);
  if (query.searchTerm) {
    searchEntitiesbyTitle = _entities.default.get({ $text: { $search: query.searchTerm }, language }, 'sharedId', { limit: 5 });
    const regexp = `.*${query.searchTerm}.*`;
    searchDictionariesByTitle = _dictionariesModel.default.db.aggregate([
    { $match: { 'values.label': { $regex: regexp, $options: 'i' } } },
    { $unwind: '$values' },
    { $match: { 'values.label': { $regex: regexp, $options: 'i' } } }]);

  }

  return Promise.all([
  _templates.default.get(),
  searchEntitiesbyTitle,
  searchDictionariesByTitle,
  _dictionariesModel.default.get(),
  _relationtypes.default.get(),
  _translations2.default.get()]).

  then(([templates, entitiesMatchedByTitle, dictionariesMatchByLabel, dictionaries, relationTypes, _translations]) => {
    const textFieldsToSearch = query.fields || _comonProperties.default.
    textFields(templates).
    map(prop => `metadata.${prop.name}`).
    concat(['title', 'fullText']);
    const documentsQuery = (0, _documentQueryBuilder.default)().
    fullTextSearch(query.searchTerm, textFieldsToSearch, 2).
    filterByTemplate(query.types).
    filterById(query.ids).
    language(language);

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
    const allUniqueProps = _comonProperties.default.allUniqueProperties(templates);
    const filteringTypes = query.types && query.types.length ? query.types : allTemplates;
    let properties = _comonProperties.default.comonFilters(templates, relationTypes, filteringTypes);
    properties = !query.types || !query.types.length ? _comonProperties.default.defaultFilters(templates) : properties;

    if (query.sort) {
      const sortingProp = allUniqueProps.find(p => `metadata.${p.name}` === query.sort);
      if (sortingProp && sortingProp.type === 'select') {
        const dictionary = dictionaries.find(d => d._id.toString() === sortingProp.content);
        const translation = (0, _translate.getLocaleTranslation)(_translations, language);
        const context = (0, _translate.getContext)(translation, dictionary._id.toString());
        const keys = dictionary.values.reduce((result, value) => {
          result[value.id] = (0, _translate.default)(context, value.label, value.label);
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
    return _elastic.default.search({ index: _elasticIndexes.default.index, body: documentsQuery.query() }).
    then(processResponse).
    catch(e => {
      throw (0, _utils.createError)(e.message, 400);
    });
  });
};

const determineInheritedProperties = templates => templates.reduce((memo, template) => {
  const inheritedProperties = memo;
  template.properties.forEach(property => {
    if (property.type === 'relationship' && property.inherit) {
      const contentTemplate = templates.find(t => t._id.toString() === property.content.toString());
      const inheritedProperty = contentTemplate.properties.find(
      p => p.type === 'geolocation' && p._id.toString() === property.inheritProperty.toString());

      if (inheritedProperty) {
        inheritedProperties[template._id.toString()] = inheritedProperties[template._id.toString()] || {};
        inheritedProperties[template._id.toString()][property.name] = { base: property, target: inheritedProperty };
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
        toFetchByTemplate[template] = toFetchByTemplate[template] || { entities: [], properties: [] };
        toFetchByTemplate[template].entities = toFetchByTemplate[template].entities.concat(row.metadata[name]);
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
  return _entities.default.get(
  query, _objectSpread({},
  toFetchByTemplate[t].properties.reduce((memo, n) => Object.assign(memo, { [`metadata.${n}`]: 1 }), {}), { sharedId: 1 }));

}));


const getInheritedEntities = async (results, language, user) => {
  const templates = await _templates.default.get();
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

const entityHasGeolocation = (entity) =>
entity.metadata &&
!!Object.keys(entity.metadata).
filter(field => entity.metadata[field]).
find(field => {
  if (/_geolocation/.test(field) && entity.metadata[field].length) {
    return true;
  }
  if (Array.isArray(entity.metadata[field])) {
    return !!entity.metadata[field].find(
    f => f.inherit_geolocation && f.inherit_geolocation.length);

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
          row.metadata[property].forEach((entity, index) => {
            const targetProperty = templatesInheritedProperties[row.template][property].target.name;
            const inherited = inheritedEntities[entity] ? inheritedEntities[entity] : { metadata: {} };
            inherited.metadata = inherited.metadata || {};
            row.metadata[property][index] = {
              entity,
              inherit_geolocation: inherited.metadata[targetProperty] || [] };

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
    let results = await mainSearch(_objectSpread({}, query, { geolocation: true }), language, user);

    if (results.rows.length) {
      const { templatesInheritedProperties, inheritedEntities } = await getInheritedEntities(results, language, user);
      results = processGeolocationResults(results, templatesInheritedProperties, inheritedEntities);
    }

    return results;
  },

  getUploadsByUser(user, language) {
    return _entities.default.get({ user: user._id, language, published: false });
  },

  searchSnippets(searchTerm, sharedId, language) {
    return Promise.all([_templates.default.get()]).
    then(([templates]) => {
      const searchFields = _comonProperties.default.textFields(templates).map(prop => `metadata.${prop.name}`).concat(['title', 'fullText']);
      const query = (0, _documentQueryBuilder.default)().
      fullTextSearch(searchTerm, searchFields, 9999).
      includeUnpublished().
      filterById(sharedId).
      language(language).
      query();

      return _elastic.default.search({ index: _elasticIndexes.default.index, body: query }).
      then(response => {
        if (response.hits.hits.length === 0) {
          return {
            count: 0,
            metadata: [],
            fullText: [] };

        }
        return snippetsFromSearchHit(response.hits.hits[0]);
      });
    });
  },

  bulkIndex(docs, _action = 'index') {
    const type = 'entity';
    const body = [];
    docs.forEach(doc => {
      let _doc = doc;
      const id = doc._id.toString();
      delete doc._id;
      delete doc._rev;
      delete doc.pdfInfo;

      let action = {};
      action[_action] = { _index: _elasticIndexes.default.index, _type: type, _id: id };
      if (_action === 'update') {
        _doc = { doc: _doc };
      }

      body.push(action);
      body.push(_doc);

      if (doc.fullText) {
        const fullText = Object.values(doc.fullText).join('\f');

        action = {};
        action[_action] = { _index: _elasticIndexes.default.index, _type: 'fullText', parent: id, _id: `${id}_fullText` };
        body.push(action);

        const fullTextQuery = {};
        let language;
        if (!doc.file || doc.file && !doc.file.language) {
          language = _languages.default.detect(fullText);
        }
        if (doc.file && doc.file.language) {
          language = (0, _languagesList.default)(doc.file.language);
        }
        fullTextQuery[`fullText_${language}`] = fullText;
        body.push(fullTextQuery);
        delete doc.fullText;
      }
    });

    return _elastic.default.bulk({ body }).
    then(res => {
      if (res.items) {
        res.items.forEach(f => {
          if (f.index.error) {
            _errorLog.default.error(`ERROR Failed to index document ${f.index._id}: ${JSON.stringify(f.index.error, null, ' ')}`);
          }
        });
      }
      return res;
    });
  },

  bulkDelete(docs) {
    const type = 'entity';
    const body = docs.map(doc => ({ delete: { _index: _elasticIndexes.default.index, _type: type, _id: doc._id } }));
    return _elastic.default.bulk({ body });
  },

  delete(entity) {
    const id = entity._id.toString();
    return _elastic.default.delete({ index: _elasticIndexes.default.index, type: 'entity', id });
  },

  deleteLanguage(language) {
    const query = { query: { match: { language } } };
    return _elastic.default.deleteByQuery({ index: _elasticIndexes.default.index, body: query });
  } };var _default =


search;exports.default = _default;