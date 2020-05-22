import languagesUtil from 'shared/languages';
import languages from 'shared/languagesList';
import errorLog from 'api/log/errorLog';
import entities from 'api/entities';
import relationships from 'api/relationships/relationships';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';

import elastic from './elastic';

const handledFailedDocsByLargeFieldErrors = (body, errors) => {
  const invalidFields = [];
  errors.forEach(error => {
    const docIndex = body.findIndex(
      doc => doc.index !== undefined && doc.index._id === error.index._id
    );
    const errorExpression = /Document contains at least one immense term in field="(\S+)".+/g;
    const matches = errorExpression.exec(error.index.error.reason);
    const docData = body[docIndex + 1];
    const field = matches[1].split(/\.(?=[^\.]+$)/)[0];
    const fieldPath = field.split('.');
    fieldPath.reduce((path, prop) => {
      const currentPath = path;
      if (currentPath[prop] !== undefined && currentPath[prop] !== Object(currentPath[prop])) {
        currentPath[prop] = currentPath[prop].substring(0, 100);
      } else if (Array.isArray(currentPath) && currentPath[0][prop] !== Object(currentPath[prop])) {
        currentPath[0][prop] = currentPath[0][prop].substring(0, 100);
      }
      return currentPath[prop];
    }, docData);
    invalidFields.push(field);
  });
  return elastic.bulk({ body, requestTimeout: 40000 }).then(() => {
    throw new Error(
      `max_bytes_length_exceeded_exception. Invalid Fields: ${invalidFields.join(',')}`
    );
  });
};

const bulkIndex = (docs, _action = 'index', elasticIndex) => {
  const body = [];
  docs.forEach(doc => {
    let docBody = Object.assign({ documents: [] }, doc);
    docBody.fullText = 'entity';
    const id = doc._id.toString();
    delete docBody._id;
    delete docBody._rev;
    delete docBody.pdfInfo;
    let action = {};
    action[_action] = { _index: elasticIndex, _id: id };
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
      const fullText = Object.values(defaultDocument.fullText).join('\f');

      action = {};
      action[_action] = {
        _index: elasticIndex,
        _id: `${id}_fullText`,
        routing: id,
      };
      body.push(action);

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
  });

  return elastic.bulk({ body, requestTimeout: 40000 }).then(res => {
    const failedDocsByLargeFieldErrors = [];
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
          if (
            f.index.error.caused_by &&
            f.index.error.caused_by.type === 'max_bytes_length_exceeded_exception'
          ) {
            failedDocsByLargeFieldErrors.push(f);
          }
        }
      });
      if (failedDocsByLargeFieldErrors.length > 0) {
        return handledFailedDocsByLargeFieldErrors(body, failedDocsByLargeFieldErrors);
      }
    }
    return res;
  });
};

const indexEntities = (
  query,
  select = '',
  limit = 50,
  { batchCallback = () => {}, elasticIndex, searchInstance }
) => {
  const index = (offset, totalRows) => {
    if (offset >= totalRows) {
      return Promise.resolve();
    }

    return entities
      .get(query, '', {
        skip: offset,
        limit,
        documentsFullText: select && select.includes('+fullText'),
      })
      .then(entitiesToIndex =>
        Promise.all(
          entitiesToIndex.map(entity =>
            relationships
              .get({ entity: entity.sharedId })
              .then(relations => ({ ...entity, relationships: relations || [] }))
          )
        )
      )
      .then(entitiesToIndex =>
        searchInstance
          .bulkIndex(entitiesToIndex, 'index', elasticIndex)
          .then(() => batchCallback(entitiesToIndex.length, totalRows))
      )
      .then(() => index(offset + limit, totalRows));
  };
  return entities.count(query).then(totalRows => index(0, totalRows));
};

export { bulkIndex, indexEntities, handledFailedDocsByLargeFieldErrors };
