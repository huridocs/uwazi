import { remove as removeAccents } from 'diacritics';

function matchesFilter(subject, filter) {
  return removeAccents(subject.toLowerCase()).includes(removeAccents(filter.toLowerCase()));
}

export function filterOptions(filter, options, optionsLabel = 'label') {
  return options.filter(
    opt =>
      matchesFilter(opt[optionsLabel], filter) ||
      (opt.options && opt.options.some(childOpt => matchesFilter(childOpt[optionsLabel], filter)))
  );
}

export default {
  filterOptions,
};
