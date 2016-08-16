import {actions as formActions} from 'react-redux-form';

export function loadEntity(form, entity, templates) {
  return function (dispatch) {
    //test
    let newEntity = Object.assign({}, entity);
    //
    if (!newEntity.template) {
      newEntity.template = templates[0]._id;
    }

    if (!newEntity.metadata) {
      newEntity.metadata = {};
    }

    let template = templates.find((t) => t._id === newEntity.template);
    template.properties.forEach((property) => {
      if (!newEntity.metadata[property.name] && property.type !== 'date') {
        newEntity.metadata[property.name] = '';
      }
    });

    dispatch(formActions.load(form, newEntity));
    dispatch(formActions.setInitial(form));
  };
}

export function changeTemplate(form, entity, template) {
  return function (dispatch) {
    let propertyNames = [];
    //test
    let newEntity = Object.assign({}, entity);
    newEntity.metadata = Object.assign({}, entity.metadata);
    //test
    template.properties.forEach((property) => {
      if (!newEntity.metadata[property.name]) {
        newEntity.metadata[property.name] = '';
      }
      propertyNames.push(property.name);
    });

    Object.keys(newEntity.metadata).forEach((propertyName) => {
      if (propertyNames.indexOf(propertyName) === -1) {
        delete newEntity.metadata[propertyName];
      }
    });

    newEntity.template = template._id;

    dispatch(formActions.setInitial(form));
    dispatch(formActions.change(form, newEntity));
  };
}
