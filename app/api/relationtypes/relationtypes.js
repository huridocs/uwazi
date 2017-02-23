import {db_url as dbUrl} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import references from 'api/references/references';
import translations from 'api/i18n/translations';
import model from './relationTypesModel';

let checkDuplicated = (relationtype) => {
  return model.get()
  .then((response) => {
    let duplicated = response.find((entry) => {
      let sameEntity = entry._id.equals(relationtype._id);
      let sameName = entry.name.trim().toLowerCase() === relationtype.name.trim().toLowerCase();
      return sameName && !sameEntity;
    });

    if (duplicated) {
      return Promise.reject('duplicated_entry');
    }
  });
};

function _save(relationtype) {
  let values = {};
  values[relationtype.name] = relationtype.name;
  return model.save(relationtype)
  .then((response) => {
    return translations.addContext(response._id, relationtype.name, values, 'Connection')
    .then(() => {
      return response;
    });
  });
}

function updateTranslation(id, oldName, newName) {
  let updatedNames = {};
  updatedNames[oldName] = newName;
  let values = {};
  values[newName] = newName;
  return translations.updateContext(id, newName, updatedNames, [], values);
}

function _update(relationtype) {
  return model.getById({_id: relationtype._id})
  .then((response) => {
    updateTranslation(relationtype._id, response.name, relationtype.name);
    return model.save(relationtype);
  });
}

export default {
  get() {
    return model.get();
  },

  getById(id) {
    return model.getById(id);
  },

  save(relationtype) {
    relationtype.type = 'relationtype';
    return checkDuplicated(relationtype)
    .then(() => {
      if (!relationtype._id) {
        return _save(relationtype);
      }
      return _update(relationtype);
    })
  },

  delete(id) {
    return references.countByRelationType(id)
    .then((referencesUsingIt) => {
      if (referencesUsingIt === 0) {
        return translations.deleteContext(id)
        .then(() => model.delete(id))
        .then(() => true);
      }

      return false;
    });
  }
};
