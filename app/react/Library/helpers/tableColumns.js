function columnsFromTemplates(templates) {
  return templates.reduce((properties, template) => {
    const propsToAdd = [];
    (template.properties || []).forEach(property => {
      if (!properties.find(columnProperty => property.name === columnProperty.name)) {
        propsToAdd.push(property);
      }
    });
    return properties.concat(propsToAdd);
  }, []);
}

export function getTableColumns(documents, templates) {
  let columns = [];
  const queriedTemplates = documents.aggregations.all._types.buckets;
  if (queriedTemplates) {
    const templateIds = queriedTemplates
      .filter(template => template.filtered.doc_count > 0)
      .map(template => template.key);

    const templatesToProcess = templates.filter(t => templateIds.find(id => t._id === id));

    if (!templatesToProcess.length) {
      return [];
    }

    const commonColumns = [
      ...templatesToProcess[0].commonProperties,
      { label: 'Template', name: 'templateName' },
    ];
    columns = commonColumns.concat(columnsFromTemplates(templatesToProcess));
  }
  return columns;
}
