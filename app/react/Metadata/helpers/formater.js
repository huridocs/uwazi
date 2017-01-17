import moment from 'moment';
import t from 'app/I18N/t';

export default {

  date(property, timestamp, showInCard) {
    let value = moment.utc(timestamp, 'X').format('ll');
    return {label: property.label, value, showInCard};
  },

  multidate(property, timestamps, showInCard) {
    let value = timestamps.map((timestamp) => {
      return {timestamp: timestamp, value: moment.utc(timestamp, 'X').format('ll')};
    });
    return {label: property.label, value, showInCard};
  },

  multidaterange(property, dateranges, showInCard) {
    let value = dateranges.map((range) => {
      let from = moment.utc(range.from, 'X').format('ll');
      let to = moment.utc(range.to, 'X').format('ll');
      return {value: `${from} - ${to}`};
    });
    return {label: property.label, value, showInCard};
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

    return {label: property.label, value, icon, url, showInCard};
  },

  multiselect(property, thesauriValues, thesauris, showInCard) {
    let thesauri = thesauris.find(thes => thes._id === property.content);

    let values = thesauriValues.map((thesauriValue) => {
      let option = thesauri.values.find(v => {
        return v.id.toString() === thesauriValue.toString();
      });

      return this.getSelectOptions(option, thesauri);
    });

    return {label: property.label, value: values, showInCard};
  },

  nested(property, rows, showInCard) {
    if (!rows[0]) {
      return {label: property.label, value: '', showInCard};
    }

    let keys = Object.keys(rows[0]);
    let result = keys.join(' | ') + ' |\n';
    result += keys.map(() => '-').join(' | ') + ' |\n';
    result += rows.map((row) => {
      return keys.map((key) => row[key].join(', ')).join(' | ');
    }).join('| \n') + ' |';

    return this.markdown(property, result, showInCard);
  },

  markdown(property, value, showInCard) {
    return {label: property.label, markdown: value, showInCard};
  },

  prepareMetadata(doc, templates, thesauris) {
    let template = templates.find(temp => temp._id === doc.template);

    if (!template || !thesauris.length) {
      return Object.assign({}, doc, {metadata: [], documentType: ''});
    }

    let metadata = template.properties.map((property) => {
      let value = doc.metadata[property.name];
      let showInCard = property.showInCard;

      if (property.type === 'select' && value) {
        return this.select(property, value, thesauris, showInCard);
      }

      if (property.type === 'multiselect' && value) {
        return this.multiselect(property, value, thesauris, showInCard);
      }

      if (property.type === 'date' && value) {
        return this.date(property, value, showInCard);
      }

      if (property.type === 'multidate' && value) {
        return this.multidate(property, value, showInCard);
      }

      if (property.type === 'multidaterange' && value) {
        return this.multidaterange(property, value, showInCard);
      }

      if (property.type === 'markdown' && value) {
        return this.markdown(property, value, showInCard);
      }

      if (property.type === 'nested' && value) {
        return this.nested(property, value, showInCard);
      }

      return {label: property.label, value, showInCard};
    });

    return Object.assign({}, doc, {metadata: metadata, documentType: template.name});
  }
};
