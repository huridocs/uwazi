import Immutable from 'immutable';
import moment from 'moment';

import { advancedSort } from 'app/utils/advancedSort';
import { store } from 'app/store';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';
import t from 'app/I18N/t';

export default {

  date(property, timestamp, showInCard) {
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

  daterange(property, daterange, showInCard) {
    return { label: property.get('label'), name: property.get('name'), value: this.formatDateRange(daterange), showInCard };
  },

  multidate(property, timestamps, showInCard) {
    const value = timestamps.map(timestamp => ({ timestamp, value: moment.utc(timestamp, 'X').format('ll') }));
    return { label: property.get('label'), name: property.get('name'), value, showInCard };
  },

  multidaterange(property, dateranges, showInCard) {
    const value = dateranges.map(range => ({ value: this.formatDateRange(range) }));
    return { label: property.get('label'), name: property.get('name'), value, showInCard };
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

    const option = thesauri.get('values').find(v => v.get('id').toString() === thesauriValue.toString());

    const { value, url, icon } = this.getSelectOptions(option, thesauri);

    return { label: property.get('label'), name: property.get('name'), value, icon, url, showInCard };
  },

  multiselect(property, thesauriValues, thesauris, showInCard) {
    const thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));

    const values = thesauriValues.map((thesauriValue) => {
      const option = thesauri.get('values').find(v => v.get('id').toString() === thesauriValue.toString());

      return this.getSelectOptions(option, thesauri);
    });

    const sortedValues = advancedSort(values, { property: 'value' });

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

    const values = thesauriValues.map((thesauriValue) => {
      const option = thesauri.get('values').find(v => v.get('id').toString() === thesauriValue.toString());

      return this.getSelectOptions(option, thesauri);
    });

    const sortedValues = advancedSort(values, { property: 'value' });

    return { label: property.get('label'), name: property.get('name'), value: sortedValues, showInCard };
  },

  nested(property, rows, showInCard) {
    if (!rows[0]) {
      return { label: property.get('label'), value: '', showInCard };
    }

    const { locale } = store.getState();
    const keys = Object.keys(rows[0]).sort();
    const translatedKeys = keys.map(key => nestedProperties[key.toLowerCase()] ? nestedProperties[key.toLowerCase()][`key_${locale}`] : key);
    let result = `| ${translatedKeys.join(' | ')}|\n`;
    result += `| ${keys.map(() => '-').join(' | ')}|\n`;
    result += `${rows.map(row => `| ${keys.map(key => (row[key] || []).join(', ')).join(' | ')}`).join('|\n')}|`;

    return this.markdown(property, result, showInCard);
  },

  markdown(property, value, showInCard) {
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

      if (type === 'select' && value) {
        return Object.assign(this.select(property, value, thesauris, showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'multiselect' && value) {
        return Object.assign(this.multiselect(property, value, thesauris, showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'relationship' && value) {
        return Object.assign(this.relationship(property, value, thesauris, showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'date' && value) {
        return Object.assign(this.date(property, value, showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'daterange' && value) {
        return Object.assign(this.daterange(property, value, showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'multidate') {
        return Object.assign(this.multidate(property, value || [], showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'multidaterange') {
        return Object.assign(this.multidaterange(property, value || [], showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'markdown' && value) {
        return Object.assign(this.markdown(property, value, showInCard), { type, translateContext: template.get('_id') });
      }

      if (type === 'nested' && value) {
        return Object.assign(this.nested(property, value, showInCard), { type: 'markdown', translateContext: template.get('_id') });
      }

      return { label: property.get('label'), name: property.get('name'), value, showInCard, translateContext: template.get('_id') };
    });

    metadata = this.addSortedProperty(metadata, templates, doc, options.sortedProperty);

    return Object.assign({}, doc, { metadata: metadata.toJS(), documentType: template.name });
  },

  addSortedProperty(metadata, templates, doc, sortedProperty) {
    const sortPropertyInMetadata = metadata.find(p => `metadata.${p.name}` === sortedProperty);
    if (!sortPropertyInMetadata && sortedProperty !== 'creationDate') {
      return metadata.push(
        templates.reduce((_property, template) => {
          if (!template.get('properties')) {
            return _property;
          }
          let matchProp = template.get('properties').find(prop => `metadata.${prop.get('name')}` === sortedProperty);
          if (matchProp) {
            matchProp = matchProp.set('type', null).set('translateContext', template.get('_id'));
          }
          return _property || matchProp;
        }, false)
      ).filter(p => p);
    }

    let result = metadata.map((prop) => {
      prop.sortedBy = false;
      if (`metadata.${prop.name}` === sortedProperty) {
        if (!prop.value) {
          prop.value = 'No value';
          prop.translateContext = 'System';
        }
        prop.sortedBy = true;
      }
      return prop;
    });


    if (sortedProperty === 'creationDate') {
      result = result.push({
        value: moment.utc(doc.creationDate).format('ll'),
        label: 'Date added',
        translateContext: 'System',
        sortedBy: true
      });
    }

    return result;
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
