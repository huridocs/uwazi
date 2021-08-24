export default {
  get: () => [
    {
      localID: 'commonTitle',
      label: 'Title',
      name: 'title',
      isCommonProperty: true,
      type: 'text',
      prioritySorting: false,
      generatedId: false,
    },
    {
      localID: 'commonCreationDate',
      label: 'Date added',
      name: 'creationDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
    {
      localID: 'commonEditDate',
      label: 'Date modified',
      name: 'editDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
  ],
};
