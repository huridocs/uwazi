import {actions as formActions} from 'react-redux-form';

export function loadDocument(form, doc, templates) {
  return function (dispatch) {
    //test
    let newDoc = Object.assign({}, doc);
    //
    if (!newDoc.template) {
      newDoc.template = templates[0]._id;
    }

    if (!newDoc.metadata) {
      newDoc.metadata = {};
    }

    let template = templates.find((t) => t._id === newDoc.template);
    template.properties.forEach((property) => {
      if (!newDoc.metadata[property.name]) {
        newDoc.metadata[property.name] = '';
      }
    });

    dispatch(formActions.load(form, newDoc));
    dispatch(formActions.setInitial(form));
  };
}

export function changeTemplate(form, doc, template) {
  return function (dispatch) {
    let propertyNames = [];
    //test
    let newDoc = Object.assign({}, doc);
    newDoc.metadata = Object.assign({}, doc.metadata);
    //test
    template.properties.forEach((property) => {
      if (!newDoc.metadata[property.name]) {
        newDoc.metadata[property.name] = '';
      }
      propertyNames.push(property.name);
    });

    Object.keys(newDoc.metadata).forEach((propertyName) => {
      if (propertyNames.indexOf(propertyName) === -1) {
        delete newDoc.metadata[propertyName];
      }
    });

    newDoc.template = template._id;

    dispatch(formActions.merge(form, newDoc));
    dispatch(formActions.setInitial(form));
  };
}
