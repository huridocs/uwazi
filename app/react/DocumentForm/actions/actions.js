import {actions as formActions} from 'react-redux-form';

export function loadDocument(oldDoc, templates) {
  return function (dispatch) {
    //test
    let doc = Object.assign({}, oldDoc);
    //
    if (!doc.template) {
      doc.template = templates[0]._id;
    }

    if (!doc.metadata) {
      doc.metadata = {};
    }

    let template = templates.find((t) => t._id === doc.template);
    template.properties.forEach((property) => {
      if (!doc.metadata[property.name]) {
        doc.metadata[property.name] = '';
      }
    });

    dispatch(formActions.load('document', doc));
    dispatch(formActions.setInitial('document'));
  };
}

export function changeTemplate(oldDoc, template) {
  return function (dispatch) {
    let propertyNames = [];
    //test
    let doc = Object.assign({}, oldDoc);
    doc.metadata = Object.assign({}, oldDoc.metadata);
    //test
    template.properties.forEach((property) => {
      if (!doc.metadata[property.name]) {
        doc.metadata[property.name] = '';
      }
      propertyNames.push(property.name);
    });

    Object.keys(doc.metadata).forEach((propertyName) => {
      if (propertyNames.indexOf(propertyName) === -1) {
        delete doc.metadata[propertyName];
      }
    });

    doc.template = template._id;

    dispatch(formActions.merge('document', doc));
    dispatch(formActions.setInitial('document'));
  };
}
