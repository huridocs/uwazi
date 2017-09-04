import moment from 'moment';
import t from 'app/I18N/t';
import {advancedSort} from 'app/utils/advancedSort';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';
import {store} from 'app/store';

export default {

  date(property, timestamp, showInCard) {
    let value = moment.utc(timestamp, 'X').format('ll');
    return {label: property.get('label'), name: property.get('name'), value, timestamp, showInCard};
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
    return {label: property.get('label'), name: property.get('name'), value: this.formatDateRange(daterange), showInCard};
  },

  multidate(property, timestamps, showInCard) {
    let value = timestamps.map((timestamp) => {
      return {timestamp: timestamp, value: moment.utc(timestamp, 'X').format('ll')};
    });
    return {label: property.get('label'), name: property.get('name'), value, showInCard};
  },

  multidaterange(property, dateranges, showInCard) {
    let value = dateranges.map((range) => {
      return {value: this.formatDateRange(range)};
    });
    return {label: property.get('label'), name: property.get('name'), value, showInCard};
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

    return {value, url, icon};
  },

  select(property, thesauriValue, thesauris, showInCard) {
    let thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));

    let option = thesauri.get('values').find(v => {
      return v.get('id').toString() === thesauriValue.toString();
    });

    const {value, url, icon} = this.getSelectOptions(option, thesauri);

    return {label: property.get('label'), name: property.get('name'), value, icon, url, showInCard};
  },

  multiselect(property, thesauriValues, thesauris, showInCard) {
    let thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));

    let values = thesauriValues.map((thesauriValue) => {
      let option = thesauri.get('values').find(v => {
        return v.get('id').toString() === thesauriValue.toString();
      });

      return this.getSelectOptions(option, thesauri);
    });

    const sortedValues = advancedSort(values, {property: 'value'});

    return {label: property.get('label'), name: property.get('name'), value: sortedValues, showInCard};
  },

  nested(property, rows, showInCard) {
    if (!rows[0]) {
      return {label: property.get('label'), value: '', showInCard};
    }

    let locale = store.getState().locale;
    let keys = Object.keys(rows[0]).sort();
    let translatedKeys = keys.map((key) => nestedProperties[key.toLowerCase()] ? nestedProperties[key.toLowerCase()]['key_' + locale] : key);
    let result = '| ' + translatedKeys.join(' | ') + '|\n';
    result += '| ' + keys.map(() => '-').join(' | ') + '|\n';
    result += rows.map((row) => {
      return '| ' + keys.map((key) => (row[key] || []).join(', ')).join(' | ');
    }).join('|\n') + '|';

    return this.markdown(property, result, showInCard);
  },

  markdown(property, value, showInCard) {
    return {label: property.get('label'), name: property.get('name'), markdown: value, showInCard};
  },

  prepareMetadataForCard(doc, templates, thesauris, sortedProperty) {
    return this.prepareMetadata(doc, templates, thesauris, {onlyForCards: true, sortedProperty});
  },

  prepareMetadata(doc, templates, thesauris, options = {}) {
    let template = templates.find(temp => temp.get('_id') === doc.template);

    if (!template || !thesauris.size) {
      return Object.assign({}, doc, {metadata: [], documentType: ''});
    }

    if (!doc.metadata) {
      doc.metadata = {};
    }

    let metadata = this.filterProperties(template, options.onlyForCards, options.sortedProperty)
    .map((property) => {
      let value = doc.metadata[property.get('name')];
      let showInCard = property.get('showInCard');

      const type = property.get('type');

      if (type === 'select' && value) {
        return Object.assign(this.select(property, value, thesauris, showInCard), {type});
      }

      if (type === 'multiselect' && value) {
        return Object.assign(this.multiselect(property, value, thesauris, showInCard), {type});
      }

      if (type === 'date' && value) {
        return Object.assign(this.date(property, value, showInCard), {type});
      }

      if (type === 'daterange' && value) {
        return Object.assign(this.daterange(property, value, showInCard), {type});
      }

      if (type === 'multidate') {
        return Object.assign(this.multidate(property, value || [], showInCard), {type});
      }

      if (type === 'multidaterange') {
        return Object.assign(this.multidaterange(property, value || [], showInCard), {type});
      }

      if (type === 'markdown' && value) {
        return Object.assign(this.markdown(property, value, showInCard), {type});
      }

      if (type === 'nested' && value) {
        return Object.assign(this.nested(property, value, showInCard), {type});
      }

      return {label: property.get('label'), name: property.get('name'), value, showInCard};
    });

    return Object.assign({}, doc, {metadata: metadata.toJS(), documentType: template.name});
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
