function appendNewOcurrency(sortableOcurrences, property, appendMetadata = true) {
  const propertyName = appendMetadata ? 'metadata.' + property.get('name') : property.get('name');

  if (!Object.keys(sortableOcurrences).includes(propertyName)) {
    sortableOcurrences[propertyName] = {type: property.get('type'), ocurrs: 0};
  }
  sortableOcurrences[propertyName].ocurrs += 1;
}

function getSortableOcurrences(validTemplates, sortableOcurrences) {
  validTemplates.forEach(template => {
    template.get('commonProperties').forEach(property => {
      if (property.get('prioritySorting')) {
        appendNewOcurrency(sortableOcurrences, property, false);
      }
    });

    template.get('properties').forEach(property => {
      const sortable = property.get('filter') && (property.get('type') === 'text' || property.get('type') === 'date');
      if (sortable && property.get('prioritySorting')) {
        appendNewOcurrency(sortableOcurrences, property);
      }
    });
  });

  return sortableOcurrences;
}

function asessCriteriaValid(validTemplates, options) {
  return validTemplates.reduce((isValid, template) => {
    let currentIsValid = isValid;

    template.get('properties').forEach(property => {
      const sortable = property.get('filter') && (property.get('type') === 'text' || property.get('type') === 'date');
      currentIsValid = Boolean(currentIsValid || sortable && 'metadata.' + property.get('name') === options.currentCriteria.sort);
    });

    return currentIsValid;
  }, false);
}

// function evalSortResults(validTemplates, options, sortResults) {
//   validTemplates.reduce((results, template) => {
//     template.get('commonProperties').forEach(property => {
//       if (property.get('prioritySorting')) {
//         appendNewOcurrency(results.sortableOcurrences, property, false);
//       }
//     });

//     results.criteriaValid = template.get('properties').reduce((valid, property) => {
//       const sortable = property.get('filter') && (property.get('type') === 'text' || property.get('type') === 'date');
//       if (sortable && property.get('prioritySorting')) {
//         appendNewOcurrency(results.sortableOcurrences, property);
//       }
//       return Boolean(valid || sortable && 'metadata.' + property.get('name') === options.currentCriteria.sort);
//     }, results.criteriaValid);

//     return sortResults;
//   }, sortResults);
// }

export default {
  get: (options = {}) => {
    if (options.override) {
      return options.override;
    }

    let sortingDefault = {sort: 'creationDate', order: 'desc', treatAs: 'number'};
    let validTemplates = [];
    let sortableOcurrences = {};

    if (options.templates) {
      validTemplates = options.templates.map(t => {
        if (!t.get('commonProperties')) {
          return t.set('commonProperties', []);
        }
        return t;
      });

      if (options.filteredTemplates && options.filteredTemplates.length) {
        validTemplates = validTemplates.filter(t => options.filteredTemplates.includes(t.get('_id')));
      }

      sortableOcurrences = getSortableOcurrences(validTemplates, sortableOcurrences);

      if (Object.keys(sortableOcurrences).length) {
        const ocurrences = Object.keys(sortableOcurrences).map(property => {
          const {type, ocurrs} = sortableOcurrences[property];
          return {name: property, type, ocurrs};
        });

        const priority = ocurrences.reduce((prev, current) => prev.ocurrs >= current.ocurrs ? prev : current);

        sortingDefault = {
          sort: priority.name,
          order: priority.type !== 'date' ? 'asc' : 'desc',
          treatAs: priority.type !== 'date' ? 'string' : 'number'
        };
      }

      console.log('currentCriteria:', options.currentCriteria);
      if (options.currentCriteria) {
        // TEST!!!
        console.log('current selectedSorting:', options.selectedSorting);
        if (options.selectedSorting && options.selectedSorting.size) {
          options.currentCriteria = options.selectedSorting.toJS();
        } else {
          options.currentCriteria = sortingDefault;
        }
        // -----

        let criteriaValid = options.currentCriteria.sort === 'title' || options.currentCriteria.sort === 'creationDate';

        if (!criteriaValid) {
          criteriaValid = asessCriteriaValid(validTemplates, options);
        }

        if (criteriaValid) {
          return options.currentCriteria;
        }
      }
    }

    return sortingDefault;
  }
};
