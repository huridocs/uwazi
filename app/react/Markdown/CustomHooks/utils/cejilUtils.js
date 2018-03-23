export function sortValues(values) {
  values.sort((a, b) => {
    if (a.results === b.results) {
      return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
    }

    return b.results - a.results;
  });

  return values;
}
