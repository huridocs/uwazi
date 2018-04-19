import Immutable from 'immutable';
import moment from 'moment';
import React from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { store } from 'app/store';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';
import t from 'app/I18N/t';
import Map from 'app/Map/Map';

const getOption = (thesauri, value) => thesauri.get('values').find(v => v.get('id').toString() === value.toString());

const addSortedProperty = (templates, sortedProperty) => templates.reduce((_property, template) => {
  if (!template.get('properties')) {
    return _property;
  }

  let matchProp = template.get('properties').find(prop => `metadata.${prop.get('name')}` === sortedProperty);

  if (matchProp) {
    matchProp = matchProp.set('type', null).set('translateContext', template.get('_id'));
  }

  return _property || matchProp;
}, false);

const formatMetadataSortedProperty = (metadata, sortedProperty) => metadata.map((prop) => {
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

const addCreationDate = (result, doc) => result.push({
  value: moment.utc(doc.creationDate).format('ll'),
  label: 'Date added',
  translateContext: 'System',
  sortedBy: true
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

  date(property, timestamp, thesauris, showInCard) {
    const value = moment.utc(timestamp, 'X').format('ll');
    return { label: property.get('label'), name: property.get('name'), value, timestamp, showInCard };
  },

  formatDateRange(daterange) {
    let from = '';
    let to = '';
    if (daterange.from) {
      from = moment.utc(daterange.from, 'X').format('ll');
    }
    if (daterange.to) {
      to = moment.utc(daterange.to, 'X').format('ll');
    }
    return `${from} ~ ${to}`;
  },

  daterange(property, daterange, thesauris, showInCard) {
    return { label: property.get('label'), name: property.get('name'), value: this.formatDateRange(daterange), showInCard };
  },

  multidate(property, timestamps = [], thesauris, showInCard) {
    const value = timestamps.map(timestamp => ({ timestamp, value: moment.utc(timestamp, 'X').format('ll') }));
    return { label: property.get('label'), name: property.get('name'), value, showInCard };
  },

  multidaterange(property, dateranges = [], thesauris, showInCard) {
    const value = dateranges.map(range => ({ value: this.formatDateRange(range) }));
    return { label: property.get('label'), name: property.get('name'), value, showInCard };
  },

  geolocation(property, value, thesauris, showInCard, renderForCard) {
    const markers = [];
    let _value;
    if (value.lat && value.lon) {
      _value = `Lat / Lon: ${value.lat} / ${value.lon}`;
      markers.push({ latitude: value.lat, longitude: value.lon });
    }
    if (!renderForCard) {
      _value = <Map latitude={value.lat} longitude={value.lon} markers={markers}/>;
    }

    return { label: property.get('label'), name: property.get('name'), value: _value, showInCard };
  },

  getSelectOptions(option, thesauri) {
    let value = '';
    let icon;
    if (option) {
      value = t(thesauri.get('_id'), option.get('label'));
      icon = option.get('icon');
    }

    let url;
    if (option && thesauri.get('type') === 'template') {
      url = `/entity/${option.get('id')}`;
    }

    return { value, url, icon };
  },

  select(property, thesauriValue, thesauris, showInCard) {
    const thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));
    const { value, url, icon } = this.getSelectOptions(getOption(thesauri, thesauriValue), thesauri);
    return { label: property.get('label'), name: property.get('name'), value, icon, url, showInCard };
  },

  multiselect(property, thesauriValues, thesauris, showInCard) {
    const thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));
    const sortedValues = this.getThesauriValues(thesauriValues, thesauri);
    return { label: property.get('label'), name: property.get('name'), value: sortedValues, showInCard };
  },

  relationship(property, thesauriValues, thesauris, showInCard) {
    const allEntitiesThesauriValues = thesauris
    .filter(_thesauri => _thesauri.get('type') === 'template')
    .reduce((result, _thesauri) => {
      if (result) {
        return result.concat(_thesauri.get('values'));
      }

      return _thesauri.get('values');
    }, null);

    const thesauri = Immutable.fromJS({
      values: allEntitiesThesauriValues,
      type: 'template'
    });

    const sortedValues = this.getThesauriValues(thesauriValues, thesauri);

    return { label: property.get('label'), name: property.get('name'), value: sortedValues, showInCard };
  },

  getThesauriValues(thesauriValues, thesauri) {
    return advancedSort(
      thesauriValues.map(thesauriValue => this.getSelectOptions(getOption(thesauri, thesauriValue), thesauri)),
      { property: 'value' }
    );
  },

  nested(property, rows, thesauris, showInCard) {
    if (!rows[0]) {
      return { label: property.get('label'), value: '', showInCard };
    }

    const { locale } = store.getState();
    const keys = Object.keys(rows[0]).sort();
    const translatedKeys = keys.map(key => nestedProperties[key.toLowerCase()] ? nestedProperties[key.toLowerCase()][`key_${locale}`] : key);
    let result = `| ${translatedKeys.join(' | ')}|\n`;
    result += `| ${keys.map(() => '-').join(' | ')}|\n`;
    result += `${rows.map(row => `| ${keys.map(key => (row[key] || []).join(', ')).join(' | ')}`).join('|\n')}|`;

    return this.markdown(property, result, thesauris, showInCard);
  },

  markdown(property, value, thesauris, showInCard) {
    return { label: property.get('label'), name: property.get('name'), value, showInCard };
  },

  prepareMetadataForCard(doc, templates, thesauris, sortedProperty) {
    return this.prepareMetadata(doc, templates, thesauris, { onlyForCards: true, sortedProperty });
  },

  prepareMetadata(_doc, templates, thesauris, options = {}) {
    const doc = _doc;
    const template = templates.find(temp => temp.get('_id') === doc.template);

    if (!template || !thesauris.size) {
      return Object.assign({}, doc, { metadata: [], documentType: '' });
    }

    if (!doc.metadata) {
      doc.metadata = {};
    }

    let metadata = this.filterProperties(template, options.onlyForCards, options.sortedProperty)
    .map((property) => {
      const value = doc.metadata[property.get('name')];
      const showInCard = property.get('showInCard');

      const type = property.get('type');

      if (this[type] && value) {
        const formatedMetadata = this[type](property, value, thesauris, showInCard, options.onlyForCards);
        return Object.assign(formatedMetadata, { type, translateContext: template.get('_id') });
      }

      return { label: property.get('label'), name: property.get('name'), value, showInCard, translateContext: template.get('_id') };
    });

    metadata = conformSortedProperty(metadata, templates, doc, options.sortedProperty);

    return Object.assign({}, doc, { metadata: metadata.toJS(), documentType: template.name });
  },

  filterProperties(template, onlyForCards, sortedProperty) {
    return template.get('properties')
    .filter((p) => {
      if (!onlyForCards) {
        return true;
      }

      if (p.get('showInCard') || sortedProperty === `metadata.${p.get('name')}`) {
        return true;
      }
      return false;
    });
  }
};
