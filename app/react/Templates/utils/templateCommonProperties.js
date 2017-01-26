export default {
  get: () => {
    return [
      {localID: 'commonTitle', label: 'Title', name: 'title', isCommonProperty: true, type: 'text', prioritySorting: false},
      {localID: 'commonCreationDate', label: 'Date added', name: 'creationDate', isCommonProperty: true, type: 'date', prioritySorting: false}
    ];
  }
};
