const defaultProperties = [
  {
    name: 'textFilter',
    label: 'textLabel',
  },
  {
    name: 'numericFilter',
    label: 'numericLabel',
    type: 'numeric',
  },
  {
    name: 'nestedFilter',
    label: 'nestedLabel',
    type: 'nested',
  },
  {
    content: 'aContent',
    name: 'selectFilter',
    label: 'selectLabel',
    type: 'select',
    options: [{ label: 'option1' }, { id: 'missing', label: 'missing' }],
  },
  {
    content: 'aContent',
    name: 'multiselectFilter',
    label: 'multiselectLabel',
    type: 'multiselect',
    options: [{ label: 'option3' }],
  },
  {
    content: 'aContent',
    name: 'relationshipFilter',
    label: 'relationshipLabel',
    type: 'relationship',
    options: [{ label: 'option2' }],
  },
  {
    content: 'oneContent',
    name: 'dateFilter',
    label: 'dateLabel',
    type: 'date',
  },
  {
    content: 'oneContent',
    name: 'daterange',
    label: 'daterangeLabel',
    type: 'daterange',
  },
  {
    content: 'oneContent',
    name: 'multidate',
    label: 'multidateLabel',
    type: 'multidate',
  },
  {
    content: 'oneContent',
    name: 'multidaterange',
    label: 'multidaterangeLabel',
    type: 'multidaterange',
  },
];

export { defaultProperties };
