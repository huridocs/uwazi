export default {
  get: () => [
    {
      label: 'Title',
      name: 'title',
      isCommonProperty: true,
      type: 'text',
      prioritySorting: false,
      generatedId: false,
    },
    {
      label: 'Date added',
      name: 'creationDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
    {
      label: 'Date modified',
      name: 'editDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
  ],
};
