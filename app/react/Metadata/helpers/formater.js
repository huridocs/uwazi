import moment from 'moment';
import t from 'app/I18N/t';
import {advancedSort} from 'app/utils/advancedSort';

export default {

  date(property, timestamp, showInCard) {
    let value = moment.utc(timestamp, 'X').format('ll');
    return {label: property.label, name: property.name, value, showInCard};
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
    return {label: property.label, name: property.name, value: this.formatDateRange(daterange), showInCard};
  },

  multidate(property, timestamps, showInCard) {
    let value = timestamps.map((timestamp) => {
      return {timestamp: timestamp, value: moment.utc(timestamp, 'X').format('ll')};
    });
    return {label: property.label, name: property.name, value, showInCard};
  },

  multidaterange(property, dateranges, showInCard) {
    let value = dateranges.map((range) => {
      return {value: this.formatDateRange(range)};
    });
    return {label: property.label, name: property.name, value, showInCard};
  },

  getSelectOptions(option, thesauri) {
    let value = '';
    let icon;
    if (option) {
      value = t(thesauri._id, option.label);
      icon = option.icon;
    }

    let url;
    if (option && thesauri.type === 'template') {
      url = `/entity/${option.id}`;
    }

    return {value, url, icon};
  },

  select(property, thesauriValue, thesauris, showInCard) {
    let thesauri = thesauris.find(thes => thes._id === property.content);

    let option = thesauri.values.find(v => {
      return v.id.toString() === thesauriValue.toString();
    });

    const {value, url, icon} = this.getSelectOptions(option, thesauri);

    return {label: property.label, name: property.name, value, icon, url, showInCard};
  },

  multiselect(property, thesauriValues, thesauris, showInCard) {
    let thesauri = thesauris.find(thes => thes._id === property.content);

    let values = thesauriValues.map((thesauriValue) => {
      let option = thesauri.values.find(v => {
        return v.id.toString() === thesauriValue.toString();
      });

      return this.getSelectOptions(option, thesauri);
    });

    const sortedValues = advancedSort(values, {property: 'value'});
    return {label: property.label, name: property.name, value: sortedValues, showInCard};
  },

  nested(property, rows, showInCard) {
    if (!rows[0]) {
      return {label: property.label, value: '', showInCard};
    }

    let keys = Object.keys(rows[0]);
    let result = '| ' + keys.join(' | ') + '|\n';
    result += '| ' + keys.map(() => '-').join(' | ') + '|\n';
    result += rows.map((row) => {
      return '| ' + keys.map((key) => (row[key] || []).join(',')).join(' | ');
    }).join('|\n') + '|';

    return this.markdown(property, result, showInCard);
  },

  markdown(property, value, showInCard) {
    return {label: property.label, name: property.name, markdown: value, showInCard};
  },

  prepareMetadata(doc, templates, thesauris) {
    let template = templates.find(temp => temp._id === doc.template);

    if (!template || !thesauris.length) {
      return Object.assign({}, doc, {metadata: [], documentType: ''});
    }

    if (!doc.metadata) {
      doc.metadata = {};
    }

    let metadata = template.properties.map((property) => {
      let value = doc.metadata[property.name];
      let showInCard = property.showInCard;

      if (property.type === 'select' && value) {
        return Object.assign(this.select(property, value, thesauris, showInCard), {type: property.type});
      }

      if (property.type === 'multiselect' && value) {
        return Object.assign(this.multiselect(property, value, thesauris, showInCard), {type: property.type});
      }

      if (property.type === 'date' && value) {
        return Object.assign(this.date(property, value, showInCard), {type: property.type});
      }

      if (property.type === 'daterange' && value) {
        return Object.assign(this.daterange(property, value, showInCard), {type: property.type});
      }

      if (property.type === 'multidate') {
        return Object.assign(this.multidate(property, value || [], showInCard), {type: property.type});
      }

      if (property.type === 'multidaterange') {
        return Object.assign(this.multidaterange(property, value || [], showInCard), {type: property.type});
      }

      if (property.type === 'markdown' && value) {
        return Object.assign(this.markdown(property, value, showInCard), {type: property.type});
      }

      if (property.type === 'nested' && value) {
        return Object.assign(this.nested(property, value, showInCard), {type: property.type});
      }

      return {label: property.label, name: property.name, value, showInCard};
    });

    return Object.assign({}, doc, {metadata: metadata, documentType: template.name});
  }
};
