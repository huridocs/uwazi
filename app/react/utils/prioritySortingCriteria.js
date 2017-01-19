function appendNewOcurrency(results, property) {
  if (!Object.keys(results.sortableOcurrences).includes(property.get('name'))) {
    results.sortableOcurrences[property.get('name')] = {type: property.get('type'), ocurrs: 0};
  }
  results.sortableOcurrences[property.get('name')].ocurrs += 1;
}

function evalSortResults(validTemplates, options, sortResults) {
  validTemplates.reduce((results, template) => {
    results.criteriaValid = template.get('properties').reduce((valid, property) => {
      const sortable = property.get('filter') && (property.get('type') === 'text' || property.get('type') === 'date');
      if (sortable && property.get('prioritySorting')) {
        appendNewOcurrency(results, property);
      }
      return Boolean(valid || sortable && 'metadata.' + property.get('name') === options.currentCriteria.sort);
    }, results.criteriaValid);

    return sortResults;
  }, sortResults);
}

export default {
  get: (options = {}) => {
    if (options.override) {
      return options.override;
    }

    if (options.currentCriteria && options.templates) {
      let validTemplates = options.templates;

      if (options.filteredTemplates && options.filteredTemplates.length) {
        validTemplates = options.templates.filter(t => options.filteredTemplates.includes(t.get('_id')));
      }

      const sortResults = {
        criteriaValid: options.currentCriteria.sort === 'title' || options.currentCriteria.sort === 'creationDate',
        sortableOcurrences: {}
      };

      evalSortResults(validTemplates, options, sortResults);

      if (sortResults.criteriaValid) {
        return options.currentCriteria;
      }

      if (Object.keys(sortResults.sortableOcurrences).length) {
        const ocurrences = Object.keys(sortResults.sortableOcurrences).map(property => {
          const {type, ocurrs} = sortResults.sortableOcurrences[property];
          return {name: property, type, ocurrs};
        });

        const priority = ocurrences.reduce((prev, current) => prev.ocurrs >= current.ocurrs ? prev : current);

        return {
          sort: 'metadata.' + priority.name,
          order: priority.type !== 'date' ? 'asc' : 'desc',
          treatAs: priority.type !== 'date' ? 'string' : 'number'
        };
      }
    }

    return {sort: 'creationDate', order: 'desc', treatAs: 'number'};
  }
};
