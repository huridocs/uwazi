/** @format */

import moment from 'moment';

export default {
  performantDocToJSWithoutRelations(doc) {
    return doc.delete('relations').toJS();
  },

  prepareMetadata(doc, templates, thesauris) {
    const template = templates.find(t => t._id === doc.template);

    if (!template || !thesauris.length) {
      return { ...doc, metadata: [], documentType: '' };
    }

    const metadata = template.properties.map(property => {
      let value = null;
      if (doc.metadata[property.name] && doc.metadata[property.name][0]) {
        [{ value }] = doc.metadata[property.name];
      }
      if (property.type === 'select' && value) {
        const thesauri = thesauris
          .find(t => t._id === property.content)
          .values.find(v => v.id.toString() === value.toString());

        value = '';
        if (thesauri) {
          value = thesauri.label;
        }
      }

      if (property.type === 'date' && value) {
        value = moment(value, 'X').format('MMM DD, YYYY');
      }

      return { label: property.label, value };
    });

    return { ...doc, metadata, documentType: template.name };
  },
};
