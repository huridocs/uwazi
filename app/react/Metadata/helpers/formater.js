/* eslint-disable max-lines */
import moment from 'moment-timezone';
import Immutable from 'immutable';
import { advancedSort } from 'app/utils/advancedSort';
import { store } from 'app/store';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';

const prepareRelatedEntity = (options, propValue, templates, property) => {
  const relation =
    options.doc && options.doc.relations
      ? options.doc.relations.find(rel => rel.entity === propValue.value)
      : undefined;

  if (relation && relation.entityData) {
    const template = templates.find(t => relation.entityData.template === t.get('_id'));
    const inheritedProperty = template
      .get('properties')
      .find(p => p.get('_id') === property.get('inherit').get('property'));
    return {
      ...relation.entityData,
      inheritedProperty: inheritedProperty.get('name'),
    };
  }

  return undefined;
};

const addSortedProperties = (templates, sortedProperties) =>
  templates.reduce((_property, template) => {
    if (!template.get('properties')) {
      return _property;
    }

    let matchProp = template
      .get('properties')
      .find(prop => sortedProperties.includes(`metadata.${prop.get('name')}`));

    if (matchProp) {
      matchProp = matchProp.set('type', null).set('translateContext', template.get('_id'));
    }

    return _property || matchProp;
  }, false);

const formatMetadataSortedProperties = (metadata, sortedProperties) =>
  metadata.map(prop => {
    const newProp = { ...prop };
    newProp.sortedBy = false;
    if (sortedProperties.includes(`metadata.${prop.name}`)) {
      newProp.sortedBy = true;
      if (!prop.value && prop.value !== 0) {
        newProp.value = 'No value';
        newProp.translateContext = 'System';
      }
    }
    return newProp;
  });

const addCreationDate = (result, doc) =>
  result.push({
    value: moment(doc.creationDate).format('ll'),
    label: 'Date added',
    name: 'creationDate',
    translateContext: 'System',
    sortedBy: true,
  });

const addModificationDate = (result, doc) =>
  result.push({
    value: moment(doc.editDate).format('ll'),
    label: 'Date modified',
    name: 'editDate',
    translateContext: 'System',
    sortedBy: true,
  });

const groupByParent = options =>
  options.reduce((groupedOptions, { parent, ...option }) => {
    if (!parent) {
      groupedOptions.push(option);
      return groupedOptions;
    }

    const alreadyDefinedOption = groupedOptions.find(o => o.parent === parent);
    if (alreadyDefinedOption) {
      alreadyDefinedOption.value.push(option);
      return groupedOptions;
    }

    const parentOption = { value: [option], parent };
    groupedOptions.push(parentOption);

    return groupedOptions;
  }, []);

const conformSortedProperty = (metadata, templates, doc, sortedProperties) => {
  const sortPropertyInMetadata = metadata.find(p =>
    sortedProperties.includes(`metadata.${p.name}`)
  );
  if (
    !sortPropertyInMetadata &&
    !sortedProperties.includes('creationDate') &&
    !sortedProperties.includes('editDate')
  ) {
    return metadata.push(addSortedProperties(templates, sortedProperties)).filter(p => p);
  }

  let result = formatMetadataSortedProperties(metadata, sortedProperties);

  if (sortedProperties.includes('creationDate')) {
    result = addCreationDate(result, doc);
  }

  if (sortedProperties.includes('editDate')) {
    result = addModificationDate(result, doc);
  }

  return result;
};

const propertyValueFormatter = {
  date: timestamp => moment.utc(timestamp, 'X').format('ll'),
};

//relationship v2
const getPropertyType = (propertyName, templates) => {
  for (let i = 0; i < templates.size; i += 1) {
    const template = templates.get(i);
    const property = template.get('properties').find(p => p.get('name') === propertyName);
    if (property) {
      return property.get('type');
    }
  }
  return 'text';
};

export default {
  formatDateRange(daterange = {}) {
    let from = '';
    let to = '';
    if (daterange.value.from) {
      from = moment.utc(daterange.value.from, 'X').format('ll');
    }
    if (daterange.value.to) {
      to = moment.utc(daterange.value.to, 'X').format('ll');
    }
    return `${from} ~ ${to}`;
  },

  getSelectOptions(option, thesaurus, doc) {
    let value = '';
    let originalValue = '';
    let icon;
    let parent;

    if (option) {
      value = option.label || option.value;
      originalValue = option.value;
      icon = option.icon;
      parent = option.parent?.label;
    }

    let url;
    if (option && thesaurus && thesaurus.get('type') === 'template') {
      url = `/entity/${option.value}`;
    }

    let relatedEntity;
    if (doc && doc.relations && doc.relations.length > 0) {
      const relation = doc.relations.find(e => e.entity === option.value);
      relatedEntity = relation?.entityData;
      relatedEntity = relatedEntity
        ? { ...relatedEntity, inheritedProperty: 'title' }
        : relatedEntity;
    }

    return { value, originalValue, url, icon, parent, relatedEntity };
  },

  multimedia(property, [{ value }], type) {
    return {
      type,
      label: property.get('label'),
      name: property.get('name'),
      style: property.get('style') || 'contain',
      noLabel: Boolean(property.get('noLabel')),
      value,
    };
  },

  date(property, date = [{}]) {
    const timestamp = date[0].value;
    const value = propertyValueFormatter.date(timestamp);
    return {
      label: property.get('label'),
      name: property.get('name'),
      value,
      timestamp,
    };
  },

  daterange(property, daterange) {
    return {
      label: property.get('label'),
      name: property.get('name'),
      value: this.formatDateRange(daterange[0]),
      originalValue: daterange[0].value,
    };
  },

  multidate(property, timestamps = []) {
    const value = timestamps.map(timestamp => ({
      timestamp: timestamp.value,
      value: moment.utc(timestamp.value, 'X').format('ll'),
    }));
    return { label: property.get('label'), name: property.get('name'), value };
  },

  multidaterange(property, dateranges = []) {
    const value = dateranges.map(range => ({
      value: this.formatDateRange(range),
      originalValue: range.value,
    }));
    return {
      label: property.get('label'),
      name: property.get('name'),
      value,
    };
  },

  image(property, value) {
    return this.multimedia(property, value, 'image');
  },

  link(_property, [value]) {
    return { ...value, type: 'link' };
  },

  preview(property, _value, _thesauri, { doc }) {
    const defaultDoc = doc.defaultDoc || {};
    return this.multimedia(
      property,
      [{ value: defaultDoc._id ? `/api/files/${defaultDoc._id}.jpg` : null }],
      'image'
    );
  },

  media(property, value) {
    return this.multimedia(property, value, 'media');
  },

  default(_property, [value]) {
    return value;
  },

  geolocation(property, value, _thesauri, { onlyForCards }) {
    return {
      label: property.get('label'),
      name: property.get('name'),
      value: value.map(geolocation => geolocation.value),
      onlyForCards: Boolean(onlyForCards),
      type: 'geolocation',
    };
  },

  select(property, [metadataValue]) {
    const { value, url, icon, parent } = this.getSelectOptions(metadataValue);
    return {
      label: property.get('label'),
      name: property.get('name'),
      originalValue: metadataValue.value,
      value,
      icon,
      url,
      parent,
    };
  },

  multiselect(property, thesauriValues) {
    const sortedValues = this.getThesauriValues(thesauriValues);
    const groupsOptions = groupByParent(sortedValues);
    return {
      label: property.get('label'),
      name: property.get('name'),
      value: groupsOptions,
    };
  },

  inherit(property, propValue, thesauri, options, templates) {
    const propertyInfo = Immutable.fromJS({
      label: property.get('label'),
      name: property.get('name'),
      type: property.get('inherit').get('type'),
      noLabel: property.get('noLabel'),
    });

    const type = propertyInfo.get('type');
    const methodType = this[type] ? type : 'default';
    let value = (propValue || [])
      .map(v => {
        if (v && v.inheritedValue) {
          if (
            !v.inheritedValue.length ||
            v.inheritedValue.every(
              iv => !(iv.value || type === null || (type === 'numeric' && iv.value === 0))
            )
          ) {
            return null;
          }

          const relatedEntity = prepareRelatedEntity(options, v, templates, property);

          const formattedValue = this[methodType](
            propertyInfo,
            v.inheritedValue,
            thesauri,
            options,
            templates
          );
          return {
            ...formattedValue,
            ...(relatedEntity && { relatedEntity }),
          };
        }

        return {};
      })
      .filter(v => v);
    let propType = 'inherit';
    if (['multidate', 'multidaterange', 'multiselect', 'geolocation'].includes(type)) {
      propType = type;
      value = this.flattenInheritedMultiValue(value, type, propValue || [], undefined, {
        doc: options.doc,
      });
    }
    value = value.filter(v => v);
    return {
      translateContext: property.get('content'),
      ...propertyInfo.toJS(),
      name: property.get('name'),
      value,
      label: property.get('label'),
      type: propType,
      inheritedType: type,
      onlyForCards: Boolean(options.onlyForCards),
      indexInTemplate: property.get('indexInTemplate'),
    };
  },

  // relationship v2
  newRelationshipWithInherit(property, propValue, thesauri, options, templates) {
    const label = property.get('label');
    const name = property.get('name');
    const denormalizedProperty = property.get('denormalizedProperty');
    const type = getPropertyType(denormalizedProperty, templates);
    const noLabel = property.get('noLabel');
    const propertyInfo = Immutable.fromJS({
      label,
      name,
      type,
      noLabel,
    });

    const methodType = this[type] ? type : 'default';
    let value = (propValue || [])
      .map(v => {
        if (v && v.inheritedValue) {
          if (
            !v.inheritedValue.length ||
            v.inheritedValue.every(
              iv => !(iv.value || type === null || (type === 'numeric' && iv.value === 0))
            )
          ) {
            return null;
          }

          const relatedEntity = prepareRelatedEntity(options, v, templates, property);

          const formattedValue = this[methodType](
            propertyInfo,
            v.inheritedValue,
            thesauri,
            options,
            templates
          );
          return {
            ...formattedValue,
            ...(relatedEntity && { relatedEntity }),
          };
        }

        return {};
      })
      .filter(v => v);
    let propType = 'inherit';
    if (['multidate', 'multidaterange', 'multiselect', 'geolocation'].includes(type)) {
      propType = type;
      value = this.flattenInheritedMultiValue(value, type, propValue || [], undefined, {
        doc: options.doc,
      });
    }
    value = value.filter(v => v);
    return {
      translateContext: property.get('content'),
      name,
      value,
      label,
      noLabel,
      type: propType,
      inheritedType: type,
      onlyForCards: Boolean(options.onlyForCards),
      indexInTemplate: property.get('indexInTemplate'),
      obsolete: options.doc.obsoleteMetadata.includes(name),
    };
  },

  flattenInheritedMultiValue(
    relationshipValues,
    type,
    thesaurusValues,
    templateThesaurus,
    { doc }
  ) {
    const result = relationshipValues.map((relationshipValue, index) => {
      let { value } = relationshipValue;
      if (!value) return [];
      if (type === 'geolocation') {
        const options = this.getSelectOptions(thesaurusValues[index], templateThesaurus, doc);
        const entityLabel = options.value;
        value = value.map(v => ({
          ...v,
          relatedEntity: options.relatedEntity ? options.relatedEntity : undefined,
          label: `${entityLabel}${v.label ? ` (${v.label})` : ''}`,
        }));
      }
      return value;
    });
    return result.flat();
  },

  newRelationship(property, thesaurusValues, _thesauri, { doc }) {
    return this.relationship(property, thesaurusValues, _thesauri, { doc });
  },

  relationship(property, thesaurusValues, _thesauri, { doc }) {
    const thesaurus = Immutable.fromJS({
      type: 'template',
    });
    const sortedValues = this.getThesauriValues(thesaurusValues, thesaurus, doc);
    return { label: property.get('label'), name: property.get('name'), value: sortedValues };
  },

  markdown(property, [{ value }], _thesauris, { type }) {
    return {
      label: property.get('label'),
      name: property.get('name'),
      value,
      type: type || 'markdown',
    };
  },

  nested(property, rows, thesauri) {
    if (!rows[0]) {
      return { label: property.get('label'), name: property.get('name'), value: '' };
    }

    const { locale } = store.getState();
    const keys = Object.keys(rows[0].value).sort();
    const translatedKeys = keys.map(key =>
      nestedProperties[key.toLowerCase()]
        ? nestedProperties[key.toLowerCase()][`key_${locale}`]
        : key
    );
    let result = `| ${translatedKeys.join(' | ')}|\n`;
    result += `| ${keys.map(() => '-').join(' | ')}|\n`;
    result += `${rows
      .map(row => `| ${keys.map(key => (row.value[key] || []).join(', ')).join(' | ')}`)
      .join('|\n')}|`;

    return this.markdown(property, [{ value: result }], thesauri, { type: 'markdown' });
  },

  getThesauriValues(thesaurusValues, thesaurus, doc) {
    return advancedSort(
      thesaurusValues
        .map(thesaurusValue => this.getSelectOptions(thesaurusValue, thesaurus, doc))
        .filter(v => v.value),
      { property: 'value' }
    );
  },

  prepareMetadataForCard(doc, templates, thesauri, sortedProperty) {
    return this.prepareMetadata(doc, templates, thesauri, null, {
      onlyForCards: true,
      sortedProperties: [sortedProperty],
    });
  },

  prepareMetadata(_doc, templates, thesauri, relationships, _options = {}) {
    const doc = { metadata: {}, ..._doc };
    const options = { sortedProperties: [], ..._options };
    const template = templates.find(temp => temp.get('_id') === doc.template);

    if (!template || !thesauri.size) {
      return { ...doc, metadata: [], documentType: '' };
    }

    let metadata = template
      .get('properties')
      .map((p, index) => p.set('indexInTemplate', index))
      .filter(
        this.filterProperties(options.onlyForCards, options.sortedProperties, {
          excludePreview: options.excludePreview,
        })
      )
      .map(property =>
        this.applyTransformation(property, {
          doc,
          thesauri,
          options,
          template,
          templates,
          relationships,
        })
      );

    metadata = conformSortedProperty(metadata, templates, doc, options.sortedProperties);

    return { ...doc, metadata: metadata.toJS(), documentType: template.get('name') };
  },

  applyTransformation(property, { doc, thesauri, options, template, templates }) {
    const value = doc.metadata[property.get('name')];
    const showInCard = property.get('showInCard');

    if (property.get('inherit')) {
      return this.inherit(property, value, thesauri, { ...options, doc }, templates);
    }

    //relationship v2
    if (property.get('denormalizedProperty')) {
      return this.newRelationshipWithInherit(
        property,
        value,
        thesauri,
        { ...options, doc },
        templates
      );
    }

    const methodType = this[property.get('type')] ? property.get('type') : 'default';

    if ((value && value.length) || methodType === 'preview') {
      return {
        translateContext: template.get('_id'),
        ...property.toJS(),
        ...this[methodType](property, value, thesauri, { ...options, doc }),
        ...(doc.obsoleteMetadata
          ? { obsolete: doc.obsoleteMetadata.includes(property.get('name')) }
          : {}),
      };
    }

    return {
      label: property.get('label'),
      name: property.get('name'),
      type: property.get('type'),
      value,
      showInCard,
      translateContext: template.get('_id'),
      ...(doc.obsoleteMetadata
        ? { obsolete: doc.obsoleteMetadata.includes(property.get('name')) }
        : {}),
    };
  },

  filterProperties(onlyForCards, sortedProperties, options = {}) {
    return p => {
      if (options.excludePreview && p.get('type') === 'preview') {
        return false;
      }

      if (!onlyForCards) {
        return true;
      }

      if (p.get('showInCard') || sortedProperties.includes(`metadata.${p.get('name')}`)) {
        return true;
      }

      return false;
    };
  },
};

export { propertyValueFormatter };
