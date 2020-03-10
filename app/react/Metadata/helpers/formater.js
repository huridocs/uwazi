/* eslint-disable max-lines */
import moment from 'moment';
import Immutable from 'immutable';
import { advancedSort } from 'app/utils/advancedSort';
import { store } from 'app/store';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';

const addSortedProperty = (templates, sortedProperty) =>
  templates.reduce((_property, template) => {
    if (!template.get('properties')) {
      return _property;
    }

    let matchProp = template
      .get('properties')
      .find(prop => `metadata.${prop.get('name')}` === sortedProperty);

    if (matchProp) {
      matchProp = matchProp.set('type', null).set('translateContext', template.get('_id'));
    }

    return _property || matchProp;
  }, false);

const formatMetadataSortedProperty = (metadata, sortedProperty) =>
  metadata.map(prop => {
    const newProp = Object.assign({}, prop);
    newProp.sortedBy = false;
    if (sortedProperty === `metadata.${prop.name}`) {
      newProp.sortedBy = true;
      if (!prop.value) {
        newProp.value = 'No value';
        newProp.translateContext = 'System';
      }
    }
    return newProp;
  });

const addCreationDate = (result, doc) =>
  result.push({
    value: moment.utc(doc.creationDate).format('ll'),
    label: 'Date added',
    translateContext: 'System',
    sortedBy: true,
  });

const conformSortedProperty = (metadata, templates, doc, sortedProperty) => {
  const sortPropertyInMetadata = metadata.find(p => sortedProperty === `metadata.${p.name}`);
  if (!sortPropertyInMetadata && sortedProperty !== 'creationDate') {
    return metadata.push(addSortedProperty(templates, sortedProperty)).filter(p => p);
  }

  let result = formatMetadataSortedProperty(metadata, sortedProperty);

  if (sortedProperty === 'creationDate') {
    result = addCreationDate(result, doc);
  }

  return result;
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

  getSelectOptions(option, thesauri) {
    let value = '';
    const { icon } = option;

    if (option) {
      value = option.label || option.value;
    }

    let url;
    if (option && thesauri && thesauri.get('type') === 'template') {
      url = `/entity/${option.value}`;
    }

    return { value, url, icon };
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
    const value = moment.utc(timestamp, 'X').format('ll');
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
    const value = dateranges.map(range => ({ value: this.formatDateRange(range) }));
    return { label: property.get('label'), name: property.get('name'), value };
  },

  image(property, value) {
    return this.multimedia(property, value, 'image');
  },

  preview(property, _value, _thesauris, { doc }) {
    const defaultDoc = doc.defaultDoc || {};
    return this.multimedia(property, [{ value: `/api/files/${defaultDoc._id}.jpg` }], 'image');
  },

  media(property, value) {
    return this.multimedia(property, value, 'media');
  },

  default(_property, [value]) {
    return value;
  },

  geolocation(property, value, _thesauris, { onlyForCards }) {
    return {
      label: property.get('label'),
      name: property.get('name'),
      value: value.map(geolocation => geolocation.value),
      onlyForCards: Boolean(onlyForCards),
      type: 'geolocation',
    };
  },

  select(property, [metadataValue], thesauris) {
    const thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));
    const { value, url, icon } = this.getSelectOptions(metadataValue, thesauri);
    return { label: property.get('label'), name: property.get('name'), value, icon, url };
  },

  multiselect(property, thesauriValues, thesauris) {
    const thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));
    const sortedValues = this.getThesauriValues(thesauriValues, thesauri);
    return { label: property.get('label'), name: property.get('name'), value: sortedValues };
  },

  inherit(property, thesauriValues = [], thesauris, options, templates, relationships) {
    const template = templates.find(templ => templ.get('_id') === property.get('content'));
    const inheritedProperty = template
      .get('properties')
      .find(p => p.get('_id') === property.get('inheritProperty'));
    const methodType = this[inheritedProperty.get('type')]
      ? inheritedProperty.get('type')
      : 'default';
    const type = inheritedProperty.get('type');
    let value = thesauriValues.map(referencedEntity => {
      const name = inheritedProperty.get('name');
      const reference = relationships.toJS().find(r => r.entity === referencedEntity.value) || {
        entityData: { metadata: {} },
      };
      const metadata = reference.entityData.metadata ? reference.entityData.metadata : {};
      if (metadata[name] || type === 'preview') {
        return this[methodType](inheritedProperty, metadata[name], thesauris, options, templates);
      }

      return { value: metadata[name] };
    });

    let propType = 'inherit';
    if (['multidate', 'multidaterange', 'multiselect', 'geolocation'].includes(type)) {
      const templateThesauris = thesauris.find(
        _thesauri => _thesauri.get('_id') === template.get('_id')
      );
      propType = type;
      value = this.flattenInheritedMultiValue(value, type, thesauriValues, templateThesauris);
    }
    return Object.assign(
      {},
      {
        translateContext: template.get('_id'),
        ...inheritedProperty.toJS(),
        value,
        label: property.get('label'),
        type: propType,
        onlyForCards: Boolean(options.onlyForCards),
      }
    );
  },

  flattenInheritedMultiValue(relationshipValues, type, thesauriValues, templateThesauris) {
    return relationshipValues.reduce((result, relationshipValue, index) => {
      if (relationshipValue.value) {
        let { value } = relationshipValue;
        if (type === 'geolocation') {
          const entityLabel = this.getSelectOptions(thesauriValues[index], templateThesauris).value;
          value = value.map(v => ({
            ...v,
            label: `${entityLabel}${v.label ? ` (${v.label})` : ''}`,
          }));
        }
        return result.concat(value);
      }
      return result;
    }, []);
  },

  relationship(property, thesauriValues, thesauris) {
    const thesauri =
      thesauris.find(thes => thes.get('_id') === property.get('content')) ||
      Immutable.fromJS({
        type: 'template',
      });
    const sortedValues = this.getThesauriValues(thesauriValues, thesauri);
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

  nested(property, rows, thesauris) {
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

    return this.markdown(property, result, thesauris, { type: 'markdown' });
  },

  getThesauriValues(thesauriValues, thesauri) {
    return advancedSort(
      thesauriValues
        .map(thesauriValue => this.getSelectOptions(thesauriValue, thesauri))
        .filter(v => v.value),
      { property: 'value' }
    );
  },

  prepareMetadataForCard(doc, templates, thesauris, sortedProperty) {
    return this.prepareMetadata(doc, templates, thesauris, null, {
      onlyForCards: true,
      sortedProperty,
    });
  },

  prepareMetadata(_doc, templates, thesauris, relationships, options = {}) {
    const doc = _doc;
    const template = templates.find(temp => temp.get('_id') === doc.template);

    if (!template || !thesauris.size) {
      return Object.assign({}, doc, { metadata: [], documentType: '' });
    }

    if (!doc.metadata) {
      doc.metadata = {};
    }

    let metadata = this.filterProperties(
      template,
      options.onlyForCards,
      options.sortedProperty
    ).map(property =>
      this.applyTransformation(property, {
        doc,
        thesauris,
        options,
        template,
        templates,
        relationships,
      })
    );

    metadata = conformSortedProperty(metadata, templates, doc, options.sortedProperty);

    return Object.assign({}, doc, { metadata: metadata.toJS(), documentType: template.name });
  },

  applyTransformation(property, { doc, thesauris, options, template, templates, relationships }) {
    const value = doc.metadata[property.get('name')];
    const showInCard = property.get('showInCard');

    if (property.get('inherit') && relationships) {
      return this.inherit(
        property,
        value,
        thesauris,
        { ...options, doc },
        templates,
        relationships
      );
    }

    const methodType = this[property.get('type')] ? property.get('type') : 'default';

    if ((value && value.length) || methodType === 'preview') {
      return Object.assign(
        {},
        { translateContext: template.get('_id'), ...property.toJS() },
        this[methodType](property, value, thesauris, { ...options, doc })
      );
    }

    return {
      label: property.get('label'),
      name: property.get('name'),
      value,
      showInCard,
      translateContext: template.get('_id'),
    };
  },

  filterProperties(template, onlyForCards, sortedProperty) {
    return template.get('properties').filter(p => {
      if (!onlyForCards) {
        return true;
      }

      if (p.get('showInCard') || sortedProperty === `metadata.${p.get('name')}`) {
        return true;
      }
      return false;
    });
  },
};
