import relationships from 'api/relationships/relationships';
import translations from 'api/i18n/translations';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { GetRelationshipsService } from 'api/relationships.v2/services/GetRelationshipsService';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { ContextType } from 'shared/translationSchema';
import { generateNames, getUpdatedNames, getDeletedProperties } from '../templates/utils';
import model from './model';

const checkDuplicated = relationtype =>
  model.get().then(response => {
    const duplicated = response.find(entry => {
      const sameEntity = entry._id.equals(relationtype._id);
      const sameName = entry.name.trim().toLowerCase() === relationtype.name.trim().toLowerCase();
      return sameName && !sameEntity;
    });

    if (duplicated) {
      return Promise.reject('duplicated_entry');
    }
  });

function _save(relationtype) {
  const values = {};
  values[relationtype.name] = relationtype.name;
  relationtype.properties.forEach(property => {
    values[property.label] = property.label;
  });
  return model
    .save(relationtype)
    .then(response =>
      translations
        .addContext(response._id, relationtype.name, values, ContextType.relationshipType)
        .then(() => response)
    );
}

const updateTranslation = (currentTemplate, template) => {
  const currentProperties = currentTemplate.properties;
  const newProperties = template.properties;

  const updatedLabels = getUpdatedNames(
    {
      prop: 'label',
      outKey: 'label',
      filterBy: '_id',
    },
    currentProperties,
    newProperties
  );
  if (currentTemplate.name !== template.name) {
    updatedLabels[currentTemplate.name] = template.name;
  }
  const deletedPropertiesByLabel = getDeletedProperties(
    currentProperties,
    newProperties,
    '_id',
    'label'
  );
  const context = template.properties.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[template.name] = template.name;

  return translations.updateContext(
    currentTemplate._id,
    template.name,
    updatedLabels,
    deletedPropertiesByLabel,
    context,
    'Connection'
  );
};

function _update(newTemplate) {
  return model.getById({ _id: newTemplate._id }).then(currentTemplate => {
    updateTranslation(currentTemplate, newTemplate);
    relationships.updateMetadataProperties(newTemplate, currentTemplate);
    return model.save(newTemplate);
  });
}

export default {
  get(query) {
    return model.get(query);
  },

  getById(id) {
    return model.getById(id);
  },

  async save(relationtype) {
    relationtype.properties = await generateNames(relationtype.properties || []);

    return checkDuplicated(relationtype).then(() => {
      if (!relationtype._id) {
        return _save(relationtype);
      }
      return _update(relationtype);
    });
  },

  async delete(id) {
    const db = getConnection();
    const getService = new GetRelationshipsService(
      new MongoRelationshipsDataSource(db),
      new AuthorizationService(new MongoPermissionsDataSource(db), undefined)
    );

    const connectionCount = await relationships.countByRelationType(id);
    const newRelationshipsAllowed = await new MongoSettingsDataSource(
      db
    ).readNewRelationshipsAllowed();
    const newRelationshipCount = newRelationshipsAllowed
      ? await getService.countByType(id.toString())
      : 0;

    if (connectionCount === 0 && newRelationshipCount === 0) {
      await translations.deleteContext(id);
      await model.delete(id);
      return true;
    }

    return false;
  },
};
