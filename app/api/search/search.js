import {index as elasticIndex} from 'api/config/elasticIndexes';
import elastic from './elastic';
import queryBuilder from './documentQueryBuilder';
import entities from '../entities';
import model from '../entities/entitiesModel';

export default {
  search(query, language) {
    let documentsQuery = queryBuilder()
    .fullTextSearch(query.searchTerm, query.fields)
    .filterMetadata(query.filters)
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

    if (query.aggregations) {
      documentsQuery.aggregations(query.aggregations);
    }

    if (query.includeUnpublished) {
      documentsQuery.includeUnpublished();
    }

    return elastic.search({index: elasticIndex, body: documentsQuery.query()})
    .then((response) => {
      let rows = response.hits.hits.map((hit) => {
        let result = hit._source;
        result._id = hit._id;
        return result;
      });

      return {rows, totalRows: response.hits.total, aggregations: response.aggregations};
    });
  },

  getUploadsByUser(user, language) {
    return model.get({user: user._id, language, published: false});
  },

  matchTitle(searchTerm, language) {
    let query = queryBuilder()
    .fullTextSearch(searchTerm, ['title'])
    .highlight(['title'])
    .language(language)
    .limit(5)
    .query();

    return elastic.search({index: elasticIndex, body: query})
    .then((response) => {
      return searchTerm === '' ? [] : response.hits.hits.map((hit) => {
        let result = hit._source;
        result._id = hit._id;
        result.title = hit.highlight.title[0];
        return result;
      });
    });
  },

  countByTemplate(templateId) {
    return entities.countByTemplate(templateId);
  },

  index(entity) {
    const id = entity._id.toString();
    delete entity._id;
    delete entity._rev;
    let fullTextIndex = Promise.resolve();
    if (entity.fullText) {
      fullTextIndex = elastic.index({index: elasticIndex, type: 'fullText', parent: id, body: {fullText: entity.fullText}});
      delete entity.fullText;
    }
    const body = entity;
    return Promise.all([
      elastic.index({index: elasticIndex, type: 'entity', id, body}),
      fullTextIndex
    ]);
  },

  bulkIndex(docs, _action = 'update', type = 'entity') {
    let body = [];
    docs.forEach((doc) => {
      let _doc = doc;
      const id = doc._id.toString();
      delete doc._id;
      let action = {};
      action[_action] = {_index: elasticIndex, _type: type, _id: id};
      if (_action === 'update') {
        _doc = {doc: _doc};
      }
      body.push(action);
      body.push(_doc);

      if (doc.fullText) {
        action = {};
        action['index'] = {_index: elasticIndex, _type: 'fullText', parent: id};
        _doc = {fullText: doc.fullText};
        delete doc.fullText;
        body.push(action);
        body.push(_doc);
      }
    });

    return elastic.bulk({body});
  },

  indexEntities(query, select, limit = 1000) {
    const index = (offset, totalRows) => {
      if (offset >= totalRows) {
        return;
      }

      return entities.get(query, select, {skip: offset, limit})
      .then((docs) => {
        return docs;
      })
      .then((docs) => this.bulkIndex(docs))
      .then(() => index(offset + limit, totalRows));
    };
    return entities.count(query)
    .then((totalRows) => {
      return index(0, totalRows);
    });
  },

  delete(entity) {
    const id = entity._id.toString();
    return elastic.delete({index: elasticIndex, type: 'entity', id});
  }
};
