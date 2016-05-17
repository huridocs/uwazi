export default {
  prepareMetadata(doc, templates, thesauris) {
    let template = templates.find(t => t._id === doc.template);
    let metadata = template.properties.map((property) => {
      let value = doc.metadata[property.name];
      if (property.type === 'select') {
        value = thesauris.find(t => t._id === property.content).values.find(v => v.id === doc.metadata[property.name]).label;
      }
      return {label: property.label, value};
    });

    return Object.assign({}, doc, {metadata: metadata});
  }
};
