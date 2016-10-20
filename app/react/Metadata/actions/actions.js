import {actions as formActions} from 'react-redux-form';

export function resetReduxForm(form) {
  return formActions.reset(form);
}

export function loadInReduxForm(form, onlyReadEntity, templates) {
  return function (dispatch) {
    //test
    let entity = Object.assign({}, onlyReadEntity);
    //

    if (!entity.template) {
      entity.template = templates[0]._id;
      if (entity.type === 'document' && templates.find(t => !t.isEntity)) {
        entity.template = templates.find(t => !t.isEntity)._id;
      }
      if (entity.type === 'entity' && templates.find(t => t.isEntity)) {
        entity.template = templates.find(t => t.isEntity)._id;
      }
    }

    if (!entity.metadata) {
      entity.metadata = {};
    }

    let template = templates.find((t) => t._id === entity.template);
    template.properties.forEach((property) => {
      if (!entity.metadata[property.name] && property.type !== 'date') {
        entity.metadata[property.name] = '';
      }
      if (!entity.metadata[property.name] && property.type === 'multiselect') {
        entity.metadata[property.name] = [];
      }
      if (!entity.metadata[property.name] && property.type === 'nested') {
        entity.metadata[property.name] = [];
      }
      if (!entity.metadata[property.name] && property.type === 'multidate') {
        entity.metadata[property.name] = [];
      }
      if (!entity.metadata[property.name] && property.type === 'multidaterange') {
        entity.metadata[property.name] = [];
      }
    });

    dispatch(formActions.load(form, entity));
    dispatch(formActions.setInitial(form));
  };
}

export function changeTemplate(form, onlyReadEntity, template) {
  return function (dispatch) {
    let propertyNames = [];
    //test
    let entity = Object.assign({}, onlyReadEntity);
    entity.metadata = Object.assign({}, onlyReadEntity.metadata);
    //test
    template.properties.forEach((property) => {
      if (!entity.metadata[property.name]) {
        entity.metadata[property.name] = '';
      }
      propertyNames.push(property.name);
    });

    Object.keys(entity.metadata).forEach((propertyName) => {
      if (propertyNames.indexOf(propertyName) === -1) {
        delete entity.metadata[propertyName];
      }
    });

    entity.template = template._id;

    dispatch(formActions.setInitial(form));
    dispatch(formActions.change(form, entity));
  };
}
