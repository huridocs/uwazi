const thesauri = [
  {
    _id: 'thesaurus1',
    name: 'Colors',
    values: [{ _id: 't1_black', label: 'black', id: 'id1_black' }],
  },
  {
    _id: 'thesaurus2',
    name: 'Names',
  },
  {
    _id: 'thesaurus3',
    name: 'Animals',
  },
];

const savedThesaurus = {
  _id: 'newThesaurus1',
  name: 'new thesaurus',
  values: [
    {
      id: 'item1',
      label: 'single value 1',
    },
    {
      id: 'item2',
      label: 'single value 2',
    },
    {
      id: 'item3',
      label: 'Group 1',
      values: [
        {
          id: 'item3-1',
          label: 'Child 1',
        },
        {
          id: 'item3-2',
          label: 'new child 2',
        },
      ],
    },
  ],
};

export { thesauri, savedThesaurus };
