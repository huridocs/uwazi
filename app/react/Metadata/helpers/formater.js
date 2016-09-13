import moment from 'moment';

export default {

  date(property, timestamp, showInCard) {
    let value = moment.utc(timestamp, 'X').format('MMM DD, YYYY');
    return {label: property.label, value, showInCard};
  },

  select(property, thesauriValue, thesauris, showInCard) {
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
      url = `/entity/${option.id}`;
    }

    return {label: property.label, value, url, showInCard};
  },

  multiselect(property, thesauriValues, thesauris, showInCard) {
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
        url = `/entity/${option.id}`;
      }

      return {value, url};
    });

    return {label: property.label, value: values, showInCard};
  },

  markdown(property, value, showInCard) {
    return {label: property.label, markdown: value, showInCard};
  },

  prepareMetadata(doc, templates, thesauris) {
    let template = templates.find(t => t._id === doc.template);

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

      if (property.type === 'markdown' && value) {
        return this.markdown(property, value, showInCard);
      }

      return {label: property.label, value, showInCard};
    });

    return Object.assign({}, doc, {metadata: metadata, documentType: template.name});
  }
};
