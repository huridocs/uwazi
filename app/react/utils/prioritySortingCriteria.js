export default function (options = {}) {
  if (options.override) {
    return options.override;
  }

  return {sort: 'creationDate', order: 'desc', treatAs: 'number'};
}
