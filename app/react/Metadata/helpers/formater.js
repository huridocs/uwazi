import moment from 'moment';

export default {

  date(property, timestamp) {
    let value = moment.utc(timestamp, 'X').format('MMM DD, YYYY');
    return {label: property.label, value};
  },

  select(property, thesauriValue, thesauris) {
    let thesauri = thesauris.find(t => t._id === property.content);

    let option = thesauri.values.find(v => {
      return v.id.toString() === thesauriValue.toString();
    });

    let value = '';
    if (option) {
      value = option.label;
    }

    let url;
    if (option && thesauri.type === 'template') {
      url = `entity/${option.id}`;
    }

    return {label: property.label, value, url};
  },

  multiselect(property, thesauriValues, thesauris) {
    let thesauri = thesauris.find(t => t._id === property.content);

    let values = thesauriValues.map((thesauriValue) => {
      let option = thesauri.values.find(v => {
        return v.id.toString() === thesauriValue.toString();
      });

      let value = '';
      if (option) {
        value = option.label;
      }

      let url;
      if (option && thesauri.type === 'template') {
        url = `entity/${option.id}`;
      }

      return {value, url};
    });

    return {label: property.label, value: values};
  },

  markdown(property, value) {
    return {label: property.label, markdown: value}
  },

  prepareMetadata(doc, templates, thesauris) {
    let template = templates.find(t => t._id === doc.template);

    if (!template || !thesauris.length) {
      return Object.assign({}, doc, {metadata: [], documentType: ''});
    }

    let metadata = template.properties.map((property) => {
      let value = doc.metadata[property.name];

      if (property.type === 'select' && value) {
        return this.select(property, value, thesauris);
      }

      if (property.type === 'multiselect' && value) {
        return this.multiselect(property, value, thesauris);
      }

      if (property.type === 'date' && value) {
        return this.date(property, value);
      }

      if (property.type === 'markdown'&& value) {
        return this.markdown(property, value);
      }

      return {label: property.label, value};
    });

    return Object.assign({}, doc, {metadata: metadata, documentType: template.name});
  }
};
